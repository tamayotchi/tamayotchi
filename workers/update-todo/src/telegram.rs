use serde::{Deserialize, Serialize};
use worker::{Fetch, Headers, Method, Request, RequestInit};

use crate::error::{AppError, AppResult};

const TELEGRAM_API: &str = "https://api.telegram.org";
const MAX_TITLE_CHARS: usize = 4_096;

#[derive(Debug, Deserialize)]
pub struct Update {
    pub update_id: i64,
    pub message: Option<Message>,
}

#[derive(Debug, Deserialize)]
pub struct Message {
    pub from: Option<User>,
    pub chat: Chat,
    pub text: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct User {
    pub id: i64,
}

#[derive(Debug, Deserialize)]
pub struct Chat {
    pub id: i64,
    #[serde(rename = "type")]
    pub kind: String,
}

#[derive(Debug, Eq, PartialEq)]
pub enum IncomingMessage {
    AddTask {
        chat_id: i64,
        update_id: i64,
        title: String,
    },
    Help {
        chat_id: i64,
    },
    Ignore,
}

#[derive(Serialize)]
struct SendMessage<'a> {
    chat_id: i64,
    text: &'a str,
}

pub fn verify_webhook_secret(received: Option<&str>, expected: &str) -> AppResult<()> {
    match received {
        Some(value) if constant_time_eq(value.as_bytes(), expected.as_bytes()) => Ok(()),
        _ => Err(AppError::Unauthorized),
    }
}

pub fn classify_update(update: Update, allowed_user_id: i64) -> AppResult<IncomingMessage> {
    let Some(message) = update.message else {
        return Ok(IncomingMessage::Ignore);
    };
    let Some(sender) = message.from else {
        return Err(AppError::Forbidden);
    };

    if sender.id != allowed_user_id
        || message.chat.id != allowed_user_id
        || message.chat.kind != "private"
    {
        return Err(AppError::Forbidden);
    }

    let Some(text) = message.text else {
        return Ok(IncomingMessage::Ignore);
    };
    let title = text.trim();

    if title.is_empty() {
        return Ok(IncomingMessage::Ignore);
    }

    if matches!(title, "/start" | "/help") {
        return Ok(IncomingMessage::Help {
            chat_id: message.chat.id,
        });
    }

    if title.chars().count() > MAX_TITLE_CHARS {
        return Err(AppError::BadRequest("Message is too long"));
    }

    Ok(IncomingMessage::AddTask {
        chat_id: message.chat.id,
        update_id: update.update_id,
        title: title.to_string(),
    })
}

pub async fn send_message(bot_token: &str, chat_id: i64, text: &str) -> AppResult<()> {
    let url = format!("{TELEGRAM_API}/bot{bot_token}/sendMessage");
    let body = serde_json::to_string(&SendMessage { chat_id, text })?;
    let headers = Headers::new();
    headers.set("Content-Type", "application/json")?;

    let mut init = RequestInit::new();
    init.with_method(Method::Post)
        .with_headers(headers)
        .with_body(Some(body.into()));

    let request = Request::new_with_init(&url, &init)
        .map_err(|_| AppError::upstream("Telegram", "could not create request"))?;
    let mut response = Fetch::Request(request)
        .send()
        .await
        .map_err(|_| AppError::upstream("Telegram", "network request failed"))?;
    let status = response.status_code();

    if status == 200 {
        return Ok(());
    }

    let detail = response
        .text()
        .await
        .map(|body| body.chars().take(500).collect::<String>())
        .unwrap_or_else(|_| "unreadable response".to_string());
    Err(AppError::upstream(
        "Telegram",
        format!("HTTP {status}: {detail}"),
    ))
}

fn constant_time_eq(left: &[u8], right: &[u8]) -> bool {
    if left.len() != right.len() {
        return false;
    }

    left.iter()
        .zip(right)
        .fold(0_u8, |difference, (left, right)| {
            difference | (left ^ right)
        })
        == 0
}

#[cfg(test)]
mod tests {
    use super::*;

    fn update(text: Option<&str>, user_id: i64) -> Update {
        Update {
            update_id: 42,
            message: Some(Message {
                from: Some(User { id: user_id }),
                chat: Chat {
                    id: user_id,
                    kind: "private".to_string(),
                },
                text: text.map(str::to_string),
            }),
        }
    }

    #[test]
    fn trims_plain_text_into_a_task() {
        assert_eq!(
            classify_update(update(Some("  Buy milk  "), 123), 123).unwrap(),
            IncomingMessage::AddTask {
                chat_id: 123,
                update_id: 42,
                title: "Buy milk".to_string(),
            }
        );
    }

    #[test]
    fn recognizes_help_without_creating_a_task() {
        assert_eq!(
            classify_update(update(Some("/start"), 123), 123).unwrap(),
            IncomingMessage::Help { chat_id: 123 }
        );
    }

    #[test]
    fn rejects_other_users() {
        assert!(matches!(
            classify_update(update(Some("Secret task"), 999), 123),
            Err(AppError::Forbidden)
        ));
    }

    #[test]
    fn ignores_updates_without_text() {
        assert_eq!(
            classify_update(update(None, 123), 123).unwrap(),
            IncomingMessage::Ignore
        );
    }

    #[test]
    fn validates_webhook_secret() {
        assert!(verify_webhook_secret(Some("correct"), "correct").is_ok());
        assert!(matches!(
            verify_webhook_secret(Some("wrong"), "correct"),
            Err(AppError::Unauthorized)
        ));
    }
}
