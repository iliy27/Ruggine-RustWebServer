use thiserror::Error;
use axum::response::{IntoResponse, Response};
use axum::http::StatusCode;
use serde_json::json;

#[derive(Error, Debug)]
pub enum MyError {
    #[error("Username already exists")]
    UsernameExists,

    #[error("Database error: {0}")]
    SqlxError(#[from] sqlx::Error),

    #[error("Password hashing failed")]
    PasswordHashingFailed,

    #[error("User not found")]
    UserNotFound,
    
    #[error("Chat not found")]
    ChatNotFound,
    
    #[error("User doesn't belong to this group")]
    UserDoesNotBelongToGroup,
    
    #[error("User already in this group")]
    UserAlreadyInGroup,

    #[error("Unknown error")]
    Unknown,
}

impl IntoResponse for MyError {
    /// Implements the `IntoResponse` trait for the `MyError` enum,
    /// allowing conversion of a `MyError` instance into an HTTP response.
    fn into_response(self) -> Response {
        let (status, error_message) = match &self {
            MyError::UsernameExists => (StatusCode::CONFLICT, self.to_string()),
            MyError::PasswordHashingFailed => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
            MyError::SqlxError(_) => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
            MyError::UserNotFound => (StatusCode::NOT_FOUND, self.to_string()),
            MyError::ChatNotFound => (StatusCode::NOT_FOUND, self.to_string()),
            MyError::UserDoesNotBelongToGroup => (StatusCode::FORBIDDEN, self.to_string()),
            MyError::UserAlreadyInGroup => (StatusCode::CONFLICT, self.to_string()),
            MyError::Unknown => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
        };

        // Create the JSON response body with the error message.
        let body = json!({
            "error": error_message,
        });

        (status, axum::Json(body)).into_response()
    }
}
