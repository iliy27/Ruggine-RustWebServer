use axum::{extract::{State, Path}, Json};
use axum::http::StatusCode;
use sqlx::SqlitePool;
use crate::route_handlers::user_handler::AuthUser;
use crate::utilities::error::MyError;
use crate::db_mapper::message::{get_messages_for_chat, Message};
use serde::Deserialize;
use crate::routes::ApiResponse;

// Handler to get all messages for a specific chat
// Returns a JSON array of Message objects
pub async fn get_chat_messages_handler(
    State(pool): State<SqlitePool>,
    AuthUser(username): AuthUser,
    Path(chat_id): Path<i64>,
) -> Result<Json<Vec<Message>>, MyError> {
    let messages = get_messages_for_chat(&pool, chat_id, &username).await?;
    Ok(Json(messages))
}

#[derive(Deserialize)]
pub struct SendMessagePayload {
    pub msg: String,
}

// Handler to send a message in a specific chat
// Returns a success message upon successful sending
pub async fn send_message_handler(
    State(pool): State<SqlitePool>,
    AuthUser(username): AuthUser,
    Path(chat_id): Path<i64>,
    Json(payload): Json<SendMessagePayload>,
) -> Result<(StatusCode, Json<ApiResponse>), MyError> {
    crate::db_mapper::message::insert_message(&pool, chat_id, &username, &payload.msg, false).await?;
    Ok((StatusCode::OK, Json(ApiResponse { message: "Message successfully sent.".to_string() })))
}