use std::time::Duration;

use base64::{Engine as _, engine::general_purpose::STANDARD};
use serde::Deserialize;
use serde_json::{Value, json};
use url::form_urlencoded;
use worker::{Delay, Fetch, Headers, Method, Request, RequestInit};

use crate::{
    config::Config,
    error::{AppError, AppResult},
    todo::{Todo, encode_todos},
};

const TOKEN_URL: &str = "https://api.dropboxapi.com/oauth2/token";
const DOWNLOAD_URL: &str = "https://content.dropboxapi.com/2/files/download";
const UPLOAD_URL: &str = "https://content.dropboxapi.com/2/files/upload";
const MAX_WRITE_ATTEMPTS: usize = 4;

pub struct DropboxClient<'a> {
    config: &'a Config,
}

#[derive(Debug)]
enum Snapshot {
    Existing { todos: Vec<Todo>, rev: String },
    Missing,
}

#[derive(Debug)]
enum UploadResult {
    Saved,
    Conflict,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
}

#[derive(Debug, Deserialize)]
struct DownloadMetadata {
    rev: String,
}

impl<'a> DropboxClient<'a> {
    pub fn new(config: &'a Config) -> Self {
        Self { config }
    }

    pub async fn prepend_task(&self, title: &str) -> AppResult<()> {
        let access_token = self.access_token().await?;

        for attempt in 0..MAX_WRITE_ATTEMPTS {
            let snapshot = self.download(&access_token).await?;
            let (mut todos, revision) = match snapshot {
                Snapshot::Existing { todos, rev } => (todos, Some(rev)),
                Snapshot::Missing => (Vec::new(), None),
            };

            todos.insert(0, Todo::pending(title));
            let contents = encode_todos(&todos)?;

            match self
                .upload(&access_token, &contents, revision.as_deref())
                .await?
            {
                UploadResult::Saved => return Ok(()),
                UploadResult::Conflict if attempt + 1 < MAX_WRITE_ATTEMPTS => {
                    let delay_ms = 50 * (1_u64 << attempt);
                    Delay::from(Duration::from_millis(delay_ms)).await;
                }
                UploadResult::Conflict => return Err(AppError::DropboxConflict),
            }
        }

        Err(AppError::DropboxConflict)
    }

    async fn access_token(&self) -> AppResult<String> {
        let credentials = format!(
            "{}:{}",
            self.config.dropbox_app_key, self.config.dropbox_app_secret
        );
        let authorization = format!("Basic {}", STANDARD.encode(credentials));
        let body = form_urlencoded::Serializer::new(String::new())
            .append_pair("grant_type", "refresh_token")
            .append_pair("refresh_token", &self.config.dropbox_refresh_token)
            .finish();

        let headers = Headers::new();
        headers.set("Authorization", &authorization)?;
        headers.set("Content-Type", "application/x-www-form-urlencoded")?;

        let mut init = RequestInit::new();
        init.with_method(Method::Post)
            .with_headers(headers)
            .with_body(Some(body.into()));

        let request = Request::new_with_init(TOKEN_URL, &init)?;
        let mut response = Fetch::Request(request).send().await?;
        let status = response.status_code();

        if status != 200 {
            let detail = response_detail(&mut response).await;
            return Err(AppError::upstream(
                "Dropbox OAuth",
                format!("HTTP {status}: {detail}"),
            ));
        }

        let token: TokenResponse = response
            .json()
            .await
            .map_err(|error| AppError::upstream("Dropbox OAuth", error.to_string()))?;

        if token.access_token.is_empty() {
            return Err(AppError::upstream(
                "Dropbox OAuth",
                "response did not contain an access token",
            ));
        }

        Ok(token.access_token)
    }

    async fn download(&self, access_token: &str) -> AppResult<Snapshot> {
        let api_argument = serde_json::to_string(&json!({
            "path": self.config.dropbox_path,
        }))?;
        let headers = dropbox_headers(access_token)?;
        headers.set("Dropbox-API-Arg", &api_argument)?;

        let mut init = RequestInit::new();
        init.with_method(Method::Post).with_headers(headers);

        let request = Request::new_with_init(DOWNLOAD_URL, &init)?;
        let mut response = Fetch::Request(request).send().await?;
        let status = response.status_code();

        if status == 409 {
            let detail = response_detail(&mut response).await;
            if detail.contains("not_found") {
                return Ok(Snapshot::Missing);
            }
            return Err(AppError::upstream(
                "Dropbox download",
                format!("HTTP 409: {detail}"),
            ));
        }

        if status != 200 {
            let detail = response_detail(&mut response).await;
            return Err(AppError::upstream(
                "Dropbox download",
                format!("HTTP {status}: {detail}"),
            ));
        }

        let metadata = response
            .headers()
            .get("Dropbox-API-Result")?
            .ok_or_else(|| {
                AppError::upstream("Dropbox download", "missing Dropbox-API-Result header")
            })?;
        let metadata: DownloadMetadata = serde_json::from_str(&metadata)
            .map_err(|error| AppError::upstream("Dropbox download", error.to_string()))?;
        let body = response.bytes().await?;
        let todos =
            serde_json::from_slice::<Vec<Todo>>(&body).map_err(|_| AppError::InvalidTodoFile)?;

        Ok(Snapshot::Existing {
            todos,
            rev: metadata.rev,
        })
    }

    async fn upload(
        &self,
        access_token: &str,
        contents: &str,
        revision: Option<&str>,
    ) -> AppResult<UploadResult> {
        let mode = revision.map_or_else(
            || Value::String("add".to_string()),
            |rev| json!({ ".tag": "update", "update": rev }),
        );
        let api_argument = serde_json::to_string(&json!({
            "path": self.config.dropbox_path,
            "mode": mode,
            "autorename": false,
            "mute": false,
            "strict_conflict": true,
        }))?;
        let headers = dropbox_headers(access_token)?;
        headers.set("Content-Type", "application/octet-stream")?;
        headers.set("Dropbox-API-Arg", &api_argument)?;

        let mut init = RequestInit::new();
        init.with_method(Method::Post)
            .with_headers(headers)
            .with_body(Some(contents.into()));

        let request = Request::new_with_init(UPLOAD_URL, &init)?;
        let mut response = Fetch::Request(request).send().await?;

        match response.status_code() {
            200 => Ok(UploadResult::Saved),
            409 => Ok(UploadResult::Conflict),
            status => {
                let detail = response_detail(&mut response).await;
                Err(AppError::upstream(
                    "Dropbox upload",
                    format!("HTTP {status}: {detail}"),
                ))
            }
        }
    }
}

fn dropbox_headers(access_token: &str) -> AppResult<Headers> {
    let headers = Headers::new();
    headers.set("Authorization", &format!("Bearer {access_token}"))?;
    Ok(headers)
}

async fn response_detail(response: &mut worker::Response) -> String {
    response
        .text()
        .await
        .map(|body| truncate(&body, 500))
        .unwrap_or_else(|_| "unreadable response".to_string())
}

fn truncate(value: &str, max_chars: usize) -> String {
    let mut chars = value.chars();
    let prefix: String = chars.by_ref().take(max_chars).collect();
    if chars.next().is_some() {
        format!("{prefix}…")
    } else {
        prefix
    }
}
