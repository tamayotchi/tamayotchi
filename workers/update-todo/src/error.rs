use std::fmt;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug)]
pub enum AppError {
    BadRequest(&'static str),
    Unauthorized,
    Forbidden,
    Configuration(&'static str),
    InvalidTodoFile,
    DropboxConflict,
    Upstream {
        service: &'static str,
        message: String,
    },
    Internal(String),
}

impl AppError {
    pub fn status_code(&self) -> u16 {
        match self {
            Self::BadRequest(_) => 400,
            Self::Unauthorized => 401,
            Self::Forbidden => 403,
            Self::DropboxConflict => 503,
            Self::Configuration(_)
            | Self::InvalidTodoFile
            | Self::Upstream { .. }
            | Self::Internal(_) => 500,
        }
    }

    pub fn public_message(&self) -> &'static str {
        match self {
            Self::BadRequest(message) => message,
            Self::Unauthorized => "Unauthorized",
            Self::Forbidden => "Forbidden",
            Self::InvalidTodoFile => "TODO.json is invalid; refusing to overwrite it",
            Self::DropboxConflict => "Dropbox file changed too often; please try again",
            Self::Configuration(_) | Self::Upstream { .. } | Self::Internal(_) => {
                "Internal server error"
            }
        }
    }

    pub fn upstream(service: &'static str, message: impl Into<String>) -> Self {
        Self::Upstream {
            service,
            message: message.into(),
        }
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::BadRequest(message) => write!(formatter, "bad request: {message}"),
            Self::Unauthorized => formatter.write_str("unauthorized request"),
            Self::Forbidden => formatter.write_str("forbidden request"),
            Self::Configuration(name) => {
                write!(formatter, "missing or invalid configuration: {name}")
            }
            Self::InvalidTodoFile => formatter.write_str("Dropbox TODO file is invalid"),
            Self::DropboxConflict => formatter.write_str("Dropbox write conflict"),
            Self::Upstream { service, message } => {
                write!(formatter, "{service} request failed: {message}")
            }
            Self::Internal(message) => write!(formatter, "internal error: {message}"),
        }
    }
}

impl std::error::Error for AppError {}

impl From<worker::Error> for AppError {
    fn from(error: worker::Error) -> Self {
        Self::Internal(error.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(error: serde_json::Error) -> Self {
        Self::Internal(error.to_string())
    }
}
