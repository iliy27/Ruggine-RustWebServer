use serde::Serialize;
use sqlx::{FromRow, SqlitePool};
use crate::utilities::error::MyError;
use crate::route_handlers::user_handler::AuthUser;
use std::collections::HashSet;

#[derive(Debug, Serialize, FromRow)]
pub struct ChatRaw {
    pub id: i64,
    pub name: Option<String>,
    pub isGroup: bool,
    pub createdAt: String,
    pub participants: String,
}

#[derive(Debug, Serialize)]
pub struct Chat {
    pub id: i64,
    pub name: Option<String>,
    pub is_group: bool,
    pub created_at: String,
    pub participants: Vec<String>,
}

pub async fn get_user_chats(pool: &SqlitePool, user: AuthUser) -> Result<Vec<Chat>, MyError> {
    let username = user.0;
    let raw_chats = sqlx::query_as::<_, ChatRaw>(
        "SELECT c.id AS id, c.name, c.isGroup, c.createdAt, GROUP_CONCAT(u.username, ',') AS participants,
                MAX(m.sendAt) as last_message_at
         FROM CHAT c
         JOIN USERS_JOINED uj ON uj.chatId = c.id
         JOIN USER u ON u.username = uj.username
         LEFT JOIN MESSAGE m ON m.chatID = c.id
         WHERE c.id IN (
             SELECT chatId FROM USERS_JOINED WHERE username = ?
         )
         GROUP BY c.id, c.name, c.isGroup, c.createdAt
         ORDER BY COALESCE(last_message_at, c.createdAt) DESC;"
    )
        .bind(&username)
        .fetch_all(pool)
        .await
        .map_err(MyError::from)?;

    let chats = raw_chats.into_iter().map(|raw| {
        let participants: Vec<String> = raw.participants
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|p| p != &username)
            .collect::<HashSet<_>>() // remove duplicates
            .into_iter()
            .collect();

        Chat {
            id: raw.id,
            name: raw.name,
            is_group: raw.isGroup,
            created_at: raw.createdAt,
            participants,
        }
    }).collect();

    Ok(chats)
}
pub async fn create_group(
    pool: &SqlitePool,
    name: Option<String>,
    is_group: bool,
    creator: AuthUser,
    participants: Vec<String>,
) -> Result<i64, MyError> {
    let creator_username = creator.0;

    // Insert new chat
    let chat_id = sqlx::query(
        "INSERT INTO CHAT (name, isGroup, createdAt) VALUES (?, ?, datetime('now', 'localtime'))"
    )
        .bind(&name)
        .bind(is_group)
        .execute(pool)
        .await
        .map_err(MyError::from)?
        .last_insert_rowid();

    // Insert only the creator into USERS_JOINED
    sqlx::query(
        "INSERT INTO USERS_JOINED (chatId, username) VALUES (?, ?)"
    )
        .bind(chat_id)
        .bind(&creator_username)
        .execute(pool)
        .await
        .map_err(MyError::from)?;

    // For each participant, check if they exist and are not the creator, then insert them
    let to_list: Vec<String> = participants.into_iter().filter(|u| u != &creator_username).collect();
    if !to_list.is_empty() {
        crate::db_mapper::request::insert_requests_per_user(pool, chat_id, AuthUser(creator_username.clone()), &to_list).await?;
    }

    // Automatic message indicating group creation
    let msg = format!("{} created the group", &creator_username);
    crate::db_mapper::message::insert_message(pool, chat_id, &creator_username, &msg, true).await?;

    Ok(chat_id)
}

pub async fn create_private_chat(
    pool: &SqlitePool,
    creator: AuthUser,
    other_username: String,
) -> Result<(i64, bool), MyError> {
    // Verify other user exists
    let other_exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM USER WHERE username = ?"
    )
        .bind(&other_username)
        .fetch_one(pool)
        .await
        .map_err(MyError::from)? > 0;

    if !other_exists {
        return Err(MyError::UserNotFound);
    }

    // See if a private chat between these two users already exists
    let existing_chat_id = sqlx::query_scalar::<_, Option<i64>>(
        r#"
        SELECT c.id
        FROM CHAT c
        JOIN USERS_JOINED uj1 ON uj1.chatId = c.id AND uj1.username = ?
        JOIN USERS_JOINED uj2 ON uj2.chatId = c.id AND uj2.username = ?
        WHERE c.isGroup = 0
        "#,
    )
        .bind(&creator.0)
        .bind(&other_username)
        .fetch_optional(pool)
        .await
        .map_err(MyError::from)?;

    if let Some(Some(chat_id)) = existing_chat_id {
        return Ok((chat_id, true)); // <-- già esiste
    }

    // Create new private chat
    let chat_id = sqlx::query(
        "INSERT INTO CHAT (isGroup, createdAt) VALUES (0, datetime('now', 'localtime'))"
    )
        .execute(pool)
        .await
        .map_err(MyError::from)?
        .last_insert_rowid();

    // Insert new chat participants
    sqlx::query(
        "INSERT INTO USERS_JOINED (chatId, username) VALUES (?, ?), (?, ?)"
    )
        .bind(chat_id)
        .bind(&creator.0)
        .bind(chat_id)
        .bind(&other_username)
        .execute(pool)
        .await
        .map_err(MyError::from)?;

    // Insert automatic message
    let msg = format!("{} started a private chat with {}", &creator.0, &other_username);
    crate::db_mapper::message::insert_message(pool, chat_id, &creator.0, &msg, true).await?;

    Ok((chat_id, false)) // <-- appena creata
}

pub async fn leave_group(
    pool: &SqlitePool,
    chat_id: i64,
    user: AuthUser,
) -> Result<(), MyError> {
    let username = &user.0;

    // Verify the chat exists and is a group
    let is_group = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM CHAT WHERE id = ? AND isGroup = 1",
    )
    .bind(chat_id)
    .fetch_one(pool)
    .await
    .map_err(MyError::from)?;

    if is_group == 0 {
        return Err(MyError::ChatNotFound);
    }

    // Verify user is in the group
    let is_member = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM USERS_JOINED WHERE username = ? AND chatId = ?",
    )
    .bind(username)
    .bind(chat_id)
    .fetch_one(pool)
    .await
    .map_err(MyError::from)?;

    if is_member == 0 {
        return Err(MyError::UserDoesNotBelongToGroup);
    }

    // Insert leaving message
    let msg = format!("{} has left the group", username);
    crate::db_mapper::message::insert_message(pool, chat_id, username, &msg, true).await?;

    // Remove user from a group
    sqlx::query(
        "DELETE FROM USERS_JOINED WHERE username = ? AND chatId = ?",
    )
        .bind(username)
        .bind(chat_id)
        .execute(pool)
        .await
        .map_err(MyError::from)?;

    // Check if only one person remains in the group
    let remaining_members = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM USERS_JOINED WHERE chatId = ?",
    )
    .bind(chat_id)
    .fetch_one(pool)
    .await
    .map_err(MyError::from)?;

    // If only one member remains, delete the group
    if remaining_members <= 0 {
        // Delete all messages from the chat
        sqlx::query("DELETE FROM MESSAGE WHERE chatId = ?")
            .bind(chat_id)
            .execute(pool)
            .await
            .map_err(MyError::from)?;

        // Delete remaining user from USERS_JOINED
        sqlx::query("DELETE FROM USERS_JOINED WHERE chatId = ?")
            .bind(chat_id)
            .execute(pool)
            .await
            .map_err(MyError::from)?;

        // Delete the chat itself
        sqlx::query("DELETE FROM CHAT WHERE id = ?")
            .bind(chat_id)
            .execute(pool)
            .await
            .map_err(MyError::from)?;
    }

    Ok(())
}