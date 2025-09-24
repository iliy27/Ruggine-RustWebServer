use axum::{
    routing::{get, post, delete},
    Router,
    Extension
};
use serde::{Serialize};
use sqlx::SqlitePool;
use crate::route_handlers::user_handler::{create_user_handler, login_handler, logout_handler};
use crate::route_handlers::chat_handler::{user_chats_handler, create_group_handler, create_private_chat_handler, leave_group_handler};
use crate::route_handlers::request_handler::{request_handler_insert, request_handler_decline, get_user_requests_handler, request_handler_accept};
use crate::route_handlers::message_handler::{get_chat_messages_handler, send_message_handler};
use async_session::{MemoryStore};
use crate::route_handlers::ws_handler::ws_handler;

// Standard API response structure for those APIs that don't return specific data, but just a success/failure message
#[derive(Debug, Serialize)]
pub struct ApiResponse {
    pub message: String,
}

// Function to create the routes for the Axum application
// Each route is associated with a specific handler function
pub async fn create_routes(pool: SqlitePool) -> Router {
    // Create an in-memory session store for managing user sessions
    let store = MemoryStore::new();
    Router::new()
        .route("/ws", get(ws_handler))
        .route("/users", post(create_user_handler))
        .route("/login", post(login_handler))
        .route("/chats", get(user_chats_handler))
        .route("/chats/:chatId/requests", post(request_handler_insert))
        .route("/requests/:chatId/delete", delete(request_handler_decline))
        .route("/requests/:chatId/accept", post(request_handler_accept))
        .route("/groups", post(create_group_handler))
        .route("/requests", get(get_user_requests_handler))
        .route("/chats", post(create_private_chat_handler))
        .route("/chats/:chatId/messages", get(get_chat_messages_handler))
        .route("/chats/:chatId/messages", post(send_message_handler))
        .route("/chats/:chatId", delete(leave_group_handler))
        .route("/logout", post(logout_handler))
        .layer(Extension(store))
        // Add the database connection pool as an extension to the router:
        // all handlers can use the same pool without having to pass it manually to each one
        .with_state(pool)
}
