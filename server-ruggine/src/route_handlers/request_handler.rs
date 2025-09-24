use axum::{extract::{State, Path}, Json, http::StatusCode};
use sqlx::SqlitePool;
use crate::db_mapper::request::{InviteRequest, insert_requests_per_user, delete_request, get_requests_for_user, accept_request, UserRequest};
use crate::utilities::error::MyError;
use crate::routes::ApiResponse;
use crate::route_handlers::user_handler::AuthUser;

// Handler to insert multiple invite requests
// Returns a message indicating how many users were invited and which were not found
pub async fn request_handler_insert(
    State(pool): State<SqlitePool>,
    AuthUser(from_user): AuthUser,
    Path(chat_id): Path<i64>,
    Json(payload): Json<InviteRequest>,
) -> Result<(StatusCode, Json<ApiResponse>), MyError> {
    let not_found_users = insert_requests_per_user(&pool, chat_id, AuthUser(from_user), &payload.to).await?;

    let total_users = payload.to.len();
    let found_users = total_users - not_found_users.len();
    
    let message = match (found_users, not_found_users.len()) {
        // All users found and invited
        (n, 0) if n > 0 => "All users invited to the group successfully.".to_string(),

        // No users found
        (0, n) if n > 0 => format!(
            "No users could be invited. These users were not found: {}",
            not_found_users.join(", ")
        ),

        // Some users found, some not found
        (found, not_found_count) if found > 0 && not_found_count > 0 => format!(
            "Invitations sent successfully to {} user(s). However, these users were not found: {}",
            found,
            not_found_users.join(", ")
        ),

        // Fallback case (should not occur)
        _ => "Unexpected error occurred.".to_string(),
    };

    let status_code = if found_users > 0 {
        StatusCode::CREATED
    } else {
        StatusCode::NOT_FOUND
    };

    Ok((
        status_code,
        Json(ApiResponse { message }),
    ))
}

// Handler to decline an invite request
// Uses AuthUser for the recipient
pub async fn request_handler_decline(
    State(pool): State<SqlitePool>,
    AuthUser(username): AuthUser,
    Path(chat_id): Path<i64>,
) -> Result<(StatusCode, Json<ApiResponse>), MyError> {
    let deleted = delete_request(&pool, chat_id, &username).await?;
    if deleted {
        Ok((
            StatusCode::OK,
            Json(ApiResponse {
                message: "Richiesta di invito rifiutata.".to_string(),
            }),
        ))
    } else {
        Ok((
            StatusCode::NOT_FOUND,
            Json(ApiResponse {
                message: "Nessuna richiesta trovata da rifiutare.".to_string(),
            }),
        ))
    }
}

// Handler to accept an invite request
// Uses AuthUser for the recipient
pub async fn request_handler_accept(
    State(pool): State<SqlitePool>,
    AuthUser(username): AuthUser,
    Path(chat_id): Path<i64>,
) -> Result<(StatusCode, Json<ApiResponse>), MyError> {
    accept_request(&pool, chat_id, AuthUser(username)).await?;
    Ok((
        StatusCode::OK,
        Json(ApiResponse {
            message: "Richiesta accettata e utente aggiunto al gruppo.".to_string(),
        }),
    ))
}

// Handler to get all invite requests for the authenticated user
// Returns a JSON array of UserRequest objects
pub async fn get_user_requests_handler(
    State(pool): State<SqlitePool>,
    AuthUser(username): AuthUser,
) -> Result<Json<Vec<UserRequest>>, MyError> {
    let requests = get_requests_for_user(&pool, AuthUser(username)).await?;
    Ok(Json(requests))
}