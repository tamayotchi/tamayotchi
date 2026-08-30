mod config;
mod dropbox;
mod error;
mod telegram;
mod todo;

use serde::Serialize;
use worker::*;

use crate::{
    config::Config,
    dropbox::DropboxClient,
    error::{AppError, AppResult},
    telegram::{IncomingMessage, Update},
};

const WEBHOOK_PATH: &str = "/telegram";
const HELP_MESSAGE: &str = "Send me a message and I will add it to your Omado todo list.";
const SUCCESS_MESSAGE: &str = "✅ Task added.";

#[derive(Serialize)]
struct ApiResponse<'a> {
    ok: bool,
    status: &'a str,
}

#[event(fetch)]
pub async fn main(mut request: Request, env: Env, _context: Context) -> Result<Response> {
    console_error_panic_hook::set_once();

    match (request.method(), request.path().as_str()) {
        (Method::Get, "/") => json_response(200, true, "update-todo"),
        (Method::Get, "/health") => json_response(200, true, "healthy"),
        (Method::Post, WEBHOOK_PATH) => match handle_webhook(&mut request, &env).await {
            Ok(response) => Ok(response),
            Err(error) => {
                console_error!("Webhook failed: {error}");
                json_response(error.status_code(), false, error.public_message())
            }
        },
        _ => json_response(404, false, "Not found"),
    }
}

async fn handle_webhook(request: &mut Request, env: &Env) -> AppResult<Response> {
    let config = Config::from_env(env)?;
    let webhook_secret = request.headers().get("X-Telegram-Bot-Api-Secret-Token")?;
    telegram::verify_webhook_secret(webhook_secret.as_deref(), &config.telegram_webhook_secret)?;

    let update: Update = request
        .json()
        .await
        .map_err(|_| AppError::BadRequest("Invalid Telegram update"))?;

    let incoming = match telegram::classify_update(update, config.telegram_allowed_user_id) {
        Ok(incoming) => incoming,
        Err(AppError::Forbidden) => {
            // Telegram retries non-2xx webhook responses. Acknowledge messages from
            // unapproved users without revealing or changing any data.
            return json_response(200, true, "ignored").map_err(AppError::from);
        }
        Err(error) => return Err(error),
    };

    match incoming {
        IncomingMessage::AddTask {
            chat_id,
            update_id,
            title,
        } => {
            DropboxClient::new(&config).prepend_task(&title).await?;
            console_log!("Added task from Telegram update {update_id}");

            if let Err(error) =
                telegram::send_message(&config.telegram_bot_token, chat_id, SUCCESS_MESSAGE).await
            {
                // The task is already durable in Dropbox. Returning an error here
                // would make Telegram redeliver the update and create a duplicate.
                console_warn!("Could not send Telegram confirmation: {error}");
            }

            json_response(200, true, "added").map_err(AppError::from)
        }
        IncomingMessage::Help { chat_id } => {
            if let Err(error) =
                telegram::send_message(&config.telegram_bot_token, chat_id, HELP_MESSAGE).await
            {
                console_warn!("Could not send Telegram help: {error}");
            }

            json_response(200, true, "helped").map_err(AppError::from)
        }
        IncomingMessage::Ignore => json_response(200, true, "ignored").map_err(AppError::from),
    }
}

fn json_response(status: u16, ok: bool, message: &str) -> Result<Response> {
    Ok(Response::from_json(&ApiResponse {
        ok,
        status: message,
    })?
    .with_status(status))
}
