use axum::{extract::{State, Path}, Json};
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

use crate::db_mapper::chat::{get_user_chats, create_group, Chat, create_private_chat, leave_group};
use crate::utilities::error::MyError;
use crate::route_handlers::user_handler::AuthUser;
use crate::routes::ApiResponse;

// Handler to get all chats for the authenticated user
// Returns a JSON array of Chat objects
pub async fn user_chats_handler(
    State(pool): State<SqlitePool>,
    user: AuthUser,
) -> Result<Json<Vec<Chat>>, MyError> {
    let chats = get_user_chats(&pool, user).await?;
    Ok(Json(chats))
}

#[derive(Deserialize)]
pub struct CreateGroupPayload {
    pub name: Option<String>,
    pub is_group: bool,
    pub participants: Vec<String>,
}

#[derive(Serialize)]
pub struct GroupChatResponse {
    pub chat_id: i64
}

// Handler to create a new group chat
// Returns the ID of the newly created chat
pub async fn create_group_handler(
    State(pool): State<SqlitePool>,
    creator: AuthUser,
    Json(payload): Json<CreateGroupPayload>,
) -> Result<Json<GroupChatResponse>, MyError> {
    let chat_id = create_group(
        &pool,
        payload.name,
        payload.is_group,
        creator,
        payload.participants,
    ).await?;
    Ok(Json(GroupChatResponse{chat_id}))
}

#[derive(Deserialize)]
pub struct CreatePrivateChatPayload {
    pub other_username: String,
}

#[derive(Serialize)]
pub struct PrivateChatResponse {
    pub chat_id: i64,
    pub already_exists: bool,
}

// Handler to create a new private chat
// Returns the ID of the chat and whether it already existed
pub async fn create_private_chat_handler(
    State(pool): State<SqlitePool>,
    creator: AuthUser,
    Json(payload): Json<CreatePrivateChatPayload>,
) -> Result<Json<PrivateChatResponse>, MyError> {
    // Modifica la funzione create_private_chat per restituire anche se già esiste
    let (chat_id, already_exists) = create_private_chat(&pool, creator, payload.other_username).await?;
    Ok(Json(PrivateChatResponse {
        chat_id,
        already_exists,
    }))
}

// Handler to leave a group chat
// Returns a success message upon leaving the group
pub async fn leave_group_handler(
    State(pool): State<SqlitePool>,
    Path(chat_id): Path<i64>,
    user: AuthUser,
) -> Result<(StatusCode, Json<ApiResponse>), MyError> {
    leave_group(&pool, chat_id, user).await?;
    Ok((
        StatusCode::OK,
        Json(ApiResponse {
            message: "Successfully left the group".to_string(),
        }),
    ))}