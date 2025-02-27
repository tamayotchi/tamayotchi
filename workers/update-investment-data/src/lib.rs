use base64::Engine;
use chrono::{TimeZone, Utc};
use chrono_tz::America::Bogota;
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, str::FromStr};
use strum_macros::EnumString;
use worker::*;

#[derive(Debug, Deserialize, EnumString, Hash, Eq, PartialEq, Clone, Serialize, Ord, PartialOrd)]
enum Provider {
    ETORO,
    XTB,
    A2CENSO,
    BRICKSAVE,
    TRII,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
struct InvestmentContent {
    date: String,
    amount: i64,
    #[serde(rename = "isYearEndValue", skip_serializing_if = "Option::is_none")]
    is_year_end_value: Option<bool>,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
struct InvestmentProvider {
    content: Vec<InvestmentContent>,
    #[serde(rename = "currencyCode")]
    currency_code: String,
}

#[derive(Deserialize, Debug)]
struct InvestmentData();

#[derive(Debug, Serialize, Deserialize)]
struct TelegramUser {
    id: i64,
    first_name: String,
    last_name: Option<String>,
    is_bot: Option<bool>,
    language_code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TelegramChat {
    id: i64,
    #[serde(rename = "type")]
    chat_type: String,
    first_name: Option<String>,
    last_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TelegramMessage {
    message_id: i64,
    from: TelegramUser,
    chat: TelegramChat,
    date: i64,
    text: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct TelegramUpdate {
    update_id: i64,
    message: TelegramMessage,
}

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    let github_token = env.secret("GITHUB_TOKEN")?.to_string();
    let raw_github_url =
        "https://raw.githubusercontent.com/Juantamayo26/tamayotchi/main/src/data/data.json";

    let mut init = RequestInit::new();
    init.with_method(Method::Get);

    let request = Request::new_with_init(raw_github_url, &init)?;
    let github_response: BTreeMap<Provider, InvestmentProvider> =
        Fetch::Request(request).send().await?.json().await?;

    let router = Router::new();
    router
        .post_async("/", move |mut req, _ctx| {
        let mut providers = github_response.clone();
        let github_token = github_token.clone();
        async move {
            let update: TelegramUpdate = req.json().await?;
            let split_message = update
                .message
                .text
                .split_whitespace()
                .collect::<Vec<&str>>();
            let provider = Provider::from_str(split_message[0]).unwrap(); // TODO manage better the error
            let amount = split_message[1].parse::<f64>()
                .map(|x| x as i64)
                .unwrap_or_else(|_| split_message[1].parse().unwrap()); // Try parsing as float first, then as integer

            {
                let provider = providers
                    .get_mut(&provider)
                    .ok_or("PROVIDER_NOT_FOUND")?;

                let utc_time = Utc.timestamp_opt(update.message.date, 0).unwrap();
                let colombia_time = utc_time.with_timezone(&Bogota);
                let date = colombia_time.naive_local().date().to_string();

                let new_investment = InvestmentContent { date, amount, is_year_end_value: None };
                provider.content.push(new_investment);
            }
            providers.iter_mut().for_each(|(_, provider)| {
                provider.content.sort_by(|a, b| a.date.cmp(&b.date));
            });
            // First, get the current file's metadata to get its SHA
            let mut headers = Headers::new();
            headers.set("Authorization", &format!("Bearer {}", github_token))?;
            headers.set("Accept", "application/vnd.github.v3+json")?;
            headers.set("User-Agent", "Cloudflare Worker")?;

            let mut init = RequestInit::new();
            init.with_method(Method::Get)
                .with_headers(headers.clone());

            let github_api_url = "https://api.github.com/repos/Juantamayo26/tamayotchi/contents/src/data/data.json";
            let file_request = Request::new_with_init(github_api_url, &init)?;
            let mut file_response = Fetch::Request(file_request).send().await?;
            let file_data: serde_json::Value = file_response.json().await?;
            let sha = file_data["sha"].as_str().ok_or("Failed to get SHA")?;

            let updated_data = serde_json::to_string_pretty(&providers)?;
            let encoded_content = base64::engine::general_purpose::STANDARD.encode(updated_data);

            // Prepare the commit with SHA
            let commit = serde_json::json!({
                "message": "Updates",
                "content": encoded_content,
                "sha": sha
            });

            // GitHub API endpoint for the file
            let github_api_url = "https://api.github.com/repos/Juantamayo26/tamayotchi/contents/src/data/data.json";

            // Create GitHub API request
            let mut headers = Headers::new();
            headers.set("Authorization", &format!("Bearer {}", github_token))?;
            headers.set("Accept", "application/vnd.github.v3+json")?;
            headers.set("Content-Type", "application/json")?;
            headers.set("User-Agent", "Cloudflare Worker")?;

            let mut init = RequestInit::new();
            init.with_method(Method::Put)
                .with_headers(headers)
                .with_body(Some(serde_json::to_string(&commit)?.into()));

            let github_request = Request::new_with_init(github_api_url, &init)?;
            let github_response = Fetch::Request(github_request).send().await?;

            if github_response.status_code() != 200 && github_response.status_code() != 201 {
                return Response::error("Failed to update GitHub", 500);
            }

            Response::ok(serde_json::to_string(&update)?)
        }
        })
        .run(req, env)
        .await
}
