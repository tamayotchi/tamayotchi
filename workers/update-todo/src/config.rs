use worker::Env;

use crate::error::{AppError, AppResult};

const TELEGRAM_BOT_TOKEN: &str = "TELEGRAM_BOT_TOKEN";
const TELEGRAM_WEBHOOK_SECRET: &str = "TELEGRAM_WEBHOOK_SECRET";
const TELEGRAM_ALLOWED_USER_ID: &str = "TELEGRAM_ALLOWED_USER_ID";
const DROPBOX_APP_KEY: &str = "DROPBOX_APP_KEY";
const DROPBOX_APP_SECRET: &str = "DROPBOX_APP_SECRET";
const DROPBOX_REFRESH_TOKEN: &str = "DROPBOX_REFRESH_TOKEN";
const DROPBOX_PATH: &str = "DROPBOX_PATH";

pub struct Config {
    pub telegram_bot_token: String,
    pub telegram_webhook_secret: String,
    pub telegram_allowed_user_id: i64,
    pub dropbox_app_key: String,
    pub dropbox_app_secret: String,
    pub dropbox_refresh_token: String,
    pub dropbox_path: String,
}

impl Config {
    pub fn from_env(env: &Env) -> AppResult<Self> {
        let telegram_allowed_user_id = secret(env, TELEGRAM_ALLOWED_USER_ID)?
            .parse::<i64>()
            .map_err(|_| AppError::Configuration(TELEGRAM_ALLOWED_USER_ID))?;
        let dropbox_path = env
            .var(DROPBOX_PATH)
            .map_err(|_| AppError::Configuration(DROPBOX_PATH))?
            .to_string();

        if !dropbox_path.starts_with('/') || dropbox_path.ends_with('/') {
            return Err(AppError::Configuration(DROPBOX_PATH));
        }

        Ok(Self {
            telegram_bot_token: secret(env, TELEGRAM_BOT_TOKEN)?,
            telegram_webhook_secret: secret(env, TELEGRAM_WEBHOOK_SECRET)?,
            telegram_allowed_user_id,
            dropbox_app_key: secret(env, DROPBOX_APP_KEY)?,
            dropbox_app_secret: secret(env, DROPBOX_APP_SECRET)?,
            dropbox_refresh_token: secret(env, DROPBOX_REFRESH_TOKEN)?,
            dropbox_path,
        })
    }
}

fn secret(env: &Env, name: &'static str) -> AppResult<String> {
    let value = env
        .secret(name)
        .map_err(|_| AppError::Configuration(name))?
        .to_string();

    if value.trim().is_empty() {
        return Err(AppError::Configuration(name));
    }

    Ok(value)
}
