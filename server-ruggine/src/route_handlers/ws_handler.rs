use axum::{
    extract::{ws::{WebSocketUpgrade, WebSocket, Message}, State, Extension},
    response::IntoResponse,
    http::{StatusCode, HeaderMap},
    Json,
};
use sqlx::SqlitePool;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, mpsc};
use once_cell::sync::Lazy;
use async_session::MemoryStore;
use headers::{Cookie, HeaderMapExt};
use async_session::SessionStore;
use futures_util::stream::StreamExt;
use futures_util::SinkExt;

#[derive(Serialize, Deserialize, Debug)]
struct ChatMessage {
    chat_id: i64,
    from_user: String,
    msg: String,
    send_at: Option<String>
}

// Global map to track user WebSocket connections
// `Arc<Mutex<...>>` is used to allow concurrent and safe access to the global map of WebSocket connections from multiple async tasks
// `mpsc::UnboundedSender<String>` is used to send messages to WebSocket clients asynchronously and without buffer limits, so each connection
// can receive messages from multiple parts of the server without blocking or risking deadlocks
pub static USER_SOCKETS: Lazy<Arc<Mutex<HashMap<String, Vec<mpsc::UnboundedSender<String>>>>>> = Lazy::new(|| {
    Arc::new(Mutex::new(HashMap::new()))
});

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(pool): State<SqlitePool>,
    headers: HeaderMap,
    Extension(store): Extension<MemoryStore>,
) -> impl IntoResponse {
    // Get session cookie from headers
    let cookies = headers.typed_get::<Cookie>();
    let Some(cookie) = cookies.and_then(|c| c.get("axum_session").map(|v| v.to_string())) else {
        println!("WebSocket: no session cookie");
        return (StatusCode::UNAUTHORIZED, Json("No session cookie")).into_response();
    };

    // Validate session
    match store.load_session(cookie).await {
        Ok(Some(session)) => {
            match session.get::<String>("user") {
                Some(user) => {
                    println!("Authenticated on WebSocket for user: {}", user);
                    // `ws.on_upgrade` closes the HTTP connection and hands control over to the specified async task
                    // A task is created via the `handle_socket` function, which receives the socket, the database pool and the authenticated username
                    return ws.on_upgrade(move |socket| handle_socket(socket, pool, user));
                }
                None => {
                    println!("WebSocket: user not logged in");
                    return (StatusCode::UNAUTHORIZED, Json("User not logged in")).into_response();
                }
            }
        }
        Ok(None) => {
            println!("WebSocket: invalid session");
            return (StatusCode::UNAUTHORIZED, Json("Invalid session")).into_response();
        }
        Err(e) => {
            println!("Session store error: {:?}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json("Session store error")).into_response();
        }
    }
}

async fn handle_socket(socket: WebSocket, pool: SqlitePool, username: String) {
    // We split the WebSocket into sender and receiver to handle sending and receiving messages independently
    // We create an unbounded channel to asynchronously send messages to the client via the sender
    let (mut ws_sender, mut ws_receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();

    // Registration: add the connection to the global map and track each user transmitter
    {
        let mut map = USER_SOCKETS.lock().await;
        map.entry(username.clone()).or_default().push(tx);
    }


    // Task: receive messages from the client via WebSocket
    // Each received message is parsed and saved to the database
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = ws_receiver.next().await {
            println!("Message received via WebSocket: {}", text);
            if let Ok(mut chat_message) = serde_json::from_str::<ChatMessage>(&text) {
                chat_message.send_at = Some(chrono::Utc::now().to_rfc3339());
                // Save the message to the database
                if let Err(e) = crate::db_mapper::message::insert_message(&pool, chat_message.chat_id, &chat_message.from_user, &chat_message.msg, false).await {
                    println!("Store message error: {:?}", e);
                    continue;
                }
            } else {
                println!("Invalid message: {}", text);
            }
        }
    });

    // Task: receive messages from the channel and send them to the client via WebSocket
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Wait for both tasks to complete
    let _ = tokio::try_join!(send_task, recv_task);

    // Disconnection: remove the connection from the global map
    {
        let mut map = USER_SOCKETS.lock().await;
        if let Some(vec) = map.get_mut(&username) {
            vec.retain(|sender| !sender.is_closed());
            if vec.is_empty() {
                map.remove(&username);
            }
        }
    }
}