use serde::{Serialize};
use sqlx::{Row, SqlitePool};
use crate::utilities::error::MyError;

#[derive(Debug, Serialize, Clone)]
pub struct Message {
    pub id: i64,
    pub chat_id: i64,
    pub msg: String,
    pub from_user: String,
    pub is_auto: bool,
    pub send_at: String,
}

pub async fn insert_message(
    pool: &SqlitePool,
    chat_id: i64,
    username: &str,
    msg: &str,
    is_auto: bool,
) -> Result<(), MyError> {
    // Verify that the user is a member of the chat
    let is_member = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM USERS_JOINED WHERE chatId = ? AND username = ?"
    )
        .bind(chat_id)
        .bind(username)
        .fetch_one(pool)
        .await
        .map_err(MyError::from)?;

    if is_member == 0 {
        return Err(MyError::UserDoesNotBelongToGroup);
    }

    // Insert message
    sqlx::query(
        "INSERT INTO MESSAGE (chatID, msg, fromUser, isAuto) VALUES (?, ?, ?, ?)"
    )
        .bind(chat_id)
        .bind(msg)
        .bind(username)
        .bind(is_auto)
        .execute(pool)
        .await
        .map_err(MyError::from)?;

    // Automatic broadcast of the message to all chat participants
    // retrieve the last inserted message
    let row = sqlx::query(
        r#"
        SELECT id, chatID, msg, fromUser, isAuto, datetime(sendAt, '+2 hours') as sendAt
        FROM MESSAGE
        WHERE chatID = ? AND fromUser = ? AND msg = ?
        ORDER BY id DESC LIMIT 1
        "#
    )
        .bind(chat_id)
        .bind(username)
        .bind(msg)
        .fetch_one(pool)
        .await
        .map_err(MyError::from)?;

    let message = crate::db_mapper::message::Message {
        id: row.try_get("id").unwrap_or_default(),
        chat_id: row.try_get("chatID").unwrap_or_default(),
        msg: row.try_get("msg").unwrap_or_default(),
        from_user: row.try_get("fromUser").unwrap_or_default(),
        is_auto: row.try_get("isAuto").unwrap_or_default(),
        send_at: row.try_get("sendAt").unwrap_or_default(),
    };

    // Serialize and send via WebSocket
    if let Ok(json) = serde_json::to_string(&message) {
        // Retrieve all usernames of participants in the chat
        let rows = sqlx::query_scalar::<_, String>(
            "SELECT GROUP_CONCAT(username, ',') FROM USERS_JOINED WHERE chatId = ?"
        )
            .bind(chat_id)
            .fetch_one(pool)
            .await
            .unwrap_or_default();
        let participants: Vec<String> = rows.split(',').map(|s| s.trim().to_string()).collect();

        // Send the message to all participants connected and joined the chat
        let user_sockets = crate::route_handlers::ws_handler::USER_SOCKETS.clone();
        let map = user_sockets.lock().await;
        for user in participants {
            if let Some(senders) = map.get(&user) {
                for sender in senders {
                    let _ = sender.send(json.clone());
                }
            }
        }
    }

    Ok(())
}

pub async fn get_messages_for_chat(
    pool: &SqlitePool,
    chat_id: i64,
    username: &str,
) -> Result<Vec<Message>, MyError> {
    // Verify that the user is a member of the chat
    let is_member = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM USERS_JOINED WHERE chatId = ? AND username = ?"
    )
        .bind(chat_id)
        .bind(username)
        .fetch_one(pool)
        .await
        .map_err(MyError::from)?;

    if is_member == 0 {
        return Err(MyError::UserDoesNotBelongToGroup);
    }

    // Retrieve messages
    let rows = sqlx::query(
        "SELECT id, chatID, msg, fromUser, isAuto, datetime(sendAt, '+2 hours') as sendAt FROM MESSAGE WHERE chatID = ? ORDER BY id ASC"
    )
        .bind(chat_id)
        .fetch_all(pool)
        .await
        .map_err(MyError::from)?;

    let messages = rows.into_iter().map(|row| Message {
        id: row.try_get("id").unwrap_or_default(),
        chat_id: row.try_get("chatID").unwrap_or_default(),
        msg: row.try_get("msg").unwrap_or_default(),
        from_user: row.try_get("fromUser").unwrap_or_default(),
        is_auto: row.try_get("isAuto").unwrap_or_default(),
        send_at: row.try_get("sendAt").unwrap_or_default(),
    }).collect();

    Ok(messages)
}