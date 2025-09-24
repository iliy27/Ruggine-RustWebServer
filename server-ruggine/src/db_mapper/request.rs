use serde::{Serialize, Deserialize};
use sqlx::{Error, Row, SqlitePool};
use crate::utilities::error::MyError;
use crate::route_handlers::user_handler::AuthUser;

#[derive(Debug, Deserialize)]
pub struct InviteRequest {
    pub to: Vec<String>,
}

pub async fn insert_requests_per_user(
    pool: &SqlitePool,
    chat_id: i64,
    from_user: AuthUser,
    to_list: &Vec<String>,
) -> Result<Vec<String>, MyError> {
    let from = &from_user.0;
    let mut not_found = Vec::new();
    let mut inserted = false;

    // 1. Verify that the chat exists and is a group
    let exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM CHAT WHERE id = ? AND isGroup = 1",
    )
        .bind(chat_id)
        .fetch_one(pool)
        .await
        .map_err(MyError::from)?;
    if exists == 0 {
        return Err(MyError::ChatNotFound);
    }

    // 2. Verify that the sender belongs to the group
    let is_member = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM USERS_JOINED WHERE username = ? AND chatId = ?",
    )
        .bind(from)
        .bind(chat_id)
        .fetch_one(pool)
        .await
        .map_err(MyError::from)?;

    if is_member == 0 {
        return Err(MyError::UserDoesNotBelongToGroup);
    }

    // 3. Iterate over the recipient users
    for to_user in to_list {
        // Controlla che l’utente esista
        let user_exists = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM USER WHERE username = ?",
        )
            .bind(to_user)
            .fetch_one(pool)
            .await
            .map_err(MyError::from)?;

        if user_exists == 0 {
            not_found.push(to_user.clone());
            continue;
        }

        // Check user is not already in the group
        let already_in_group = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM USERS_JOINED WHERE username = ? AND chatId = ?",
        )
            .bind(to_user)
            .bind(chat_id)
            .fetch_one(pool)
            .await
            .map_err(MyError::from)?;

        if already_in_group > 0 {
            continue;
        }

        // Insert the request
        sqlx::query(
            "INSERT INTO REQUEST (fromUser, toUser, chatID) VALUES (?, ?, ?)",
        )
            .bind(from)
            .bind(to_user)
            .bind(chat_id)
            .execute(pool)
            .await
            .map_err(MyError::from)?;
        inserted = true;
    }

    if inserted {
        Ok(not_found)
    } else {
        Err(MyError::UserNotFound)
    }
}

pub async fn delete_request(pool: &SqlitePool, chat_id: i64, to_user: &str,
) -> Result<bool, Error> {
    let res = sqlx::query(
        "DELETE FROM REQUEST WHERE chatID = ? AND toUser = ?",
    )
        .bind(chat_id)
        .bind(to_user)
        .execute(pool)
        .await?;
    Ok(res.rows_affected() > 0)
}

pub async fn accept_request(
    pool: &SqlitePool,
    chat_id: i64,
    to_user: AuthUser,
) -> Result<(), MyError> {
    let username = &to_user.0;

    // Insert user into the group
    sqlx::query(
        "INSERT INTO USERS_JOINED (chatId, username) VALUES (?, ?)"
    )
        .bind(chat_id)
        .bind(username)
        .execute(pool)
        .await
        .map_err(MyError::from)?;

    // Insert automatic message
    let msg = format!("{} joined the group", username);
    crate::db_mapper::message::insert_message(pool, chat_id, username, &msg, true).await?;

    // Delete the request
    sqlx::query(
        "DELETE FROM REQUEST WHERE chatID = ? AND toUser = ?"
    )
        .bind(chat_id)
        .bind(username)
        .execute(pool)
        .await
        .map_err(MyError::from)?;

    Ok(())
}

#[derive(Debug, Serialize)]
pub struct UserRequest {
    pub chat_id: i64,
    pub from: String,
    pub name: String,
}

pub async fn get_requests_for_user(
    pool: &SqlitePool,
    user: AuthUser,
) -> Result<Vec<UserRequest>, MyError> {
    let username = &user.0;
    let rows = sqlx::query(
        "
        SELECT R.chatID as chat_id, R.fromUser as \"from\", C.name as \"name\"
        FROM REQUEST R
        JOIN CHAT C ON R.chatID = C.id
        WHERE R.toUser = ?
        "
    )
        .bind(username)
        .fetch_all(pool)
        .await
        .map_err(MyError::from)?;

    Ok(rows
        .into_iter()
        .map(|row| UserRequest {
            chat_id: row.try_get("chat_id").unwrap_or_default(),
            from: row.try_get("from").unwrap_or_default(),
            name: row.try_get("name").unwrap_or_default(),
        })
        .collect())
}