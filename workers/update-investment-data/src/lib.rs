use base64::Engine;
use chrono::{TimeZone, Utc};
use chrono_tz::America::Bogota;
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, fmt, str::FromStr};
use strum_macros::EnumString;
use worker::*;

const GITHUB_REPO_PATH: &str = "tamayotchi/tamayotchi";
const DATA_FILE_PATH: &str = "src/data/data.json";

#[derive(Debug, Deserialize, EnumString, Hash, Eq, PartialEq, Clone, Serialize, Ord, PartialOrd)]
enum Provider {
    ETORO,
    XTB,
    A2CENSO,
    BRICKSAVE,
    TRII,
}

impl fmt::Display for Provider {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Provider::ETORO => write!(f, "ETORO"),
            Provider::XTB => write!(f, "XTB"),
            Provider::A2CENSO => write!(f, "A2CENSO"),
            Provider::BRICKSAVE => write!(f, "BRICKSAVE"),
            Provider::TRII => write!(f, "TRII"),
        }
    }
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

async fn fetch_investment_data() -> Result<BTreeMap<Provider, InvestmentProvider>> {
    let raw_github_url = format!(
        "https://raw.githubusercontent.com/{}/main/{}",
        GITHUB_REPO_PATH, DATA_FILE_PATH
    );

    let mut init = RequestInit::new();
    init.with_method(Method::Get);

    let request = Request::new_with_init(&raw_github_url, &init)?;
    let mut response = Fetch::Request(request).send().await?;

    if response.status_code() != 200 {
        return Err(Error::from("Failed to fetch investment data"));
    }

    let data: BTreeMap<Provider, InvestmentProvider> = response.json().await?;
    // Sort content by date for each provider
    // let mut sorted_data = data.clone();
    // for (_, provider) in sorted_data.iter_mut() {
    //     provider.content.sort_by(|a, b| a.date.cmp(&b.date));
    // }
    Ok(data)
}

fn parse_investment_command(message: &str) -> Result<(Provider, i64)> {
    let split_message: Vec<&str> = message.split_whitespace().collect();

    if split_message.len() < 2 {
        return Err(Error::from("Invalid command format. Use: PROVIDER AMOUNT"));
    }

    let provider = Provider::from_str(split_message[0])
        .map_err(|_| Error::from("Invalid provider"))?;
    let amount = split_message[1].parse::<i64>()
        .map_err(|_| Error::from("Invalid amount"))?;

    Ok((provider, amount))
}

fn create_investment_entry(timestamp: i64, amount: i64) -> InvestmentContent {
    let utc_time = Utc.timestamp_opt(timestamp, 0).unwrap();
    let colombia_time = utc_time.with_timezone(&Bogota);
    let date = colombia_time.naive_local().date().to_string();
    
    InvestmentContent {
        date,
        amount,
        is_year_end_value: None,
    }
}

async fn get_github_file_sha(github_token: &str) -> Result<String> {
    let github_api_url = format!(
        "https://api.github.com/repos/{}/contents/{}",
        GITHUB_REPO_PATH, DATA_FILE_PATH
    );

    let headers = create_github_headers(github_token)?;

    let mut init = RequestInit::new();
    init.with_method(Method::Get)
        .with_headers(headers);

    let file_request = Request::new_with_init(&github_api_url, &init)?;
    let mut file_response = Fetch::Request(file_request).send().await?;

    if file_response.status_code() != 200 {
        return Err(Error::from("Failed to get file metadata"));
    }

    let file_data: serde_json::Value = file_response.json().await?;
    let sha = file_data["sha"].as_str()
        .ok_or_else(|| Error::from("Failed to get SHA"))?;

    Ok(sha.to_string())
}

fn create_github_headers(github_token: &str) -> Result<Headers> {
    let mut headers = Headers::new();
    headers.set("Authorization", &format!("Bearer {}", github_token))?;
    headers.set("Accept", "application/vnd.github.v3+json")?;
    headers.set("User-Agent", "Cloudflare Worker")?;
    headers.set("Content-Type", "application/json")?;

    Ok(headers)
}

async fn update_github_file(
    github_token: &str,
    data: &BTreeMap<Provider, InvestmentProvider>,
    sha: &str,
) -> Result<bool> {
    let github_api_url = format!(
        "https://api.github.com/repos/{}/contents/{}",
        GITHUB_REPO_PATH, DATA_FILE_PATH
    );
    let updated_data = serde_json::to_string_pretty(data)?;
    let encoded_content = base64::engine::general_purpose::STANDARD.encode(updated_data);
    let commit = serde_json::json!({
        "message": "Update investment data",
        "content": encoded_content,
        "sha": sha
    });
    let headers = create_github_headers(github_token)?;
    let mut init = RequestInit::new();
    init.with_method(Method::Put)
        .with_headers(headers)
        .with_body(Some(serde_json::to_string(&commit)?.into()));

    let github_request = Request::new_with_init(&github_api_url, &init)?;
    let github_response = Fetch::Request(github_request).send().await?;

    Ok(github_response.status_code() == 200 || github_response.status_code() == 201)
}

async fn send_telegram_message(
    bot_token: &str,
    chat_id: i64,
    message: &str,
) -> Result<bool> {
    let telegram_api_url = format!(
        "https://api.telegram.org/bot{}/sendMessage",
        bot_token
    );
    let telegram_payload = serde_json::json!({
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    });

    let mut telegram_headers = Headers::new();
    telegram_headers.set("Content-Type", "application/json")?;

    let mut telegram_init = RequestInit::new();
    telegram_init
        .with_method(Method::Post)
        .with_headers(telegram_headers)
        .with_body(Some(serde_json::to_string(&telegram_payload)?.into()));

    let telegram_request = Request::new_with_init(&telegram_api_url, &telegram_init)?;
    let telegram_response = Fetch::Request(telegram_request).send().await?;

    Ok(telegram_response.status_code() == 200)
}

async fn handle_telegram_update(
    update: TelegramUpdate,
    providers: &mut BTreeMap<Provider, InvestmentProvider>,
    github_token: &str,
    telegram_token: &str,
) -> Result<Response> {
    // Parse the command
    let (provider_type, amount) = parse_investment_command(&update.message.text)?;
    let provider_name = provider_type.to_string();

    let provider = providers
        .get_mut(&provider_type)
        .ok_or_else(|| Error::from("Provider not found"))?;

    let new_investment = create_investment_entry(update.message.date, amount);
    provider.content.push(new_investment);
    provider.content.sort_by(|a, b| a.date.cmp(&b.date));

    // Update GitHub
    let sha = get_github_file_sha(github_token).await?;
    let update_success = update_github_file(github_token, providers, &sha).await?;

    if !update_success {
        return Response::error("Failed to update GitHub", 500);
    }

    // Send confirmation message
    let success_message = format!(
        "✅ Successfully added {} {} to your investments.", 
        amount, 
        provider_name
    );

    let message_sent = send_telegram_message(
        telegram_token,
        update.message.chat.id,
        &success_message
    ).await?;

    if !message_sent {
        return Response::error("Failed to send Telegram notification", 500);
    }

    Response::ok(serde_json::to_string(&update)?)
}

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    let github_token = env.secret("GITHUB_TOKEN")?.to_string();
    let telegram_bot_token = env.secret("TELEGRAM_BOT_TOKEN")?.to_string();
    let investment_data = fetch_investment_data().await?;

    let router = Router::new();
    router
        .post_async("/", move |mut req, _ctx| {
            let mut providers = investment_data.clone();
            let github_token = github_token.clone();
            let telegram_token = telegram_bot_token.clone();

            async move {
                let update: TelegramUpdate = req.json().await?;
                handle_telegram_update(update, &mut providers, &github_token, &telegram_token).await
            }
        })
        .run(req, env)
        .await
}
