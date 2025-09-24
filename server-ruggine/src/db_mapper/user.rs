use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool, Row};
use crate::utilities::utils::{hash_password, verify_password};
use crate::utilities::error::MyError;

#[derive(Debug, Serialize, FromRow, Clone)]
pub struct User {
    pub username: String,
    pub name: String,
    pub surname: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub name: String,
    pub surname: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

pub async fn create_user(
    pool: &SqlitePool,
    mut payload: CreateUserRequest,
) -> Result<(), MyError> {
    // 1. Verify if username exists
    let exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM USER WHERE username = ?"
    )
        .bind(&payload.username)
        .fetch_one(pool)
        .await
        .map_err(MyError::from)?;

    if exists > 0 {
        return Err(MyError::UsernameExists);
    }

    // 2. Hash of password
    payload.password = hash_password(&payload.password).map_err(|_| MyError::PasswordHashingFailed)?;

    // 3. Insert
    sqlx::query(
        "INSERT INTO USER (username, name, surname, password) VALUES (?, ?, ?, ?)"
    )
        .bind(&payload.username)
        .bind(&payload.name)
        .bind(&payload.surname)
        .bind(&payload.password)
        .execute(pool)
        .await
        .map_err(MyError::from)?;

    Ok(())
}

pub async fn verify_user(pool: &SqlitePool, username: &str, password: &str) -> Result<bool, MyError> {
    let row = sqlx::query("SELECT password FROM USER WHERE username = ?")
        .bind(username)
        .fetch_optional(pool)
        .await
        .map_err(MyError::from)?;

    match row {
        Some(row) => {
            let hashed_password: String = row.try_get("password")?;
            let valid = verify_password(&hashed_password, password).unwrap_or(false);
            Ok(valid)
        }
        None => Ok(false), // Username not found
    }
}

