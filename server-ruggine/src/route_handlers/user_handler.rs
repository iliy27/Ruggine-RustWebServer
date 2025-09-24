use axum::{
    async_trait,
    extract::{FromRequestParts, Extension, State},
    http::{request::Parts, StatusCode, HeaderMap, HeaderValue},
    Json,
};
use sqlx::SqlitePool;
use crate::db_mapper::user::{self, CreateUserRequest, LoginRequest};
use crate::routes::ApiResponse;
use crate::utilities::error::MyError;
use async_session::{Session, MemoryStore, SessionStore};
use headers::{Cookie, HeaderMapExt};

// Extractor for authentication
pub struct AuthUser(pub String);

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    MemoryStore: Send + Sync,
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    /// Extracts an authenticated user from the request parts.
    /// This implementation retrieves the session cookie, validates the session,
    /// and extracts the username from the session data.
    /// Returns a rejection with an appropriate HTTP status code and error message
    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let Extension(store) = Extension::<MemoryStore>::from_request_parts(parts, state)
            .await
            .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Session store missing".to_string()))?;

        let cookies = parts.headers.typed_get::<Cookie>();
        let Some(cookie) = cookies.and_then(|c| c.get("axum_session").map(|v| v.to_string())) else {
            return Err((StatusCode::UNAUTHORIZED, "No session cookie".to_string()));
        };

        let Some(session) = store.load_session(cookie.to_string()).await.unwrap() else {
            return Err((StatusCode::UNAUTHORIZED, "Invalid session".to_string()));
        };

        let Some(user) = session.get::<String>("user") else {
            return Err((StatusCode::UNAUTHORIZED, "User not logged in".to_string()));
        };

        Ok(AuthUser(user))
    }
}

// Handler for creating a new user
pub async fn create_user_handler(
    State(pool): State<SqlitePool>,
    Extension(_store): Extension<MemoryStore>,
    Json(payload): Json<CreateUserRequest>,
) -> (StatusCode, Json<ApiResponse>) {
    match user::create_user(&pool, payload).await {
        Ok(_) => (StatusCode::CREATED, Json(ApiResponse { message: "User created successfully.".to_string() })),
        Err(MyError::UsernameExists) => (StatusCode::CONFLICT, Json(ApiResponse { message: "Username already exists.".to_string() })),
        Err(MyError::PasswordHashingFailed) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse { message: "password hashing failed.".to_string() })),
        Err(MyError::SqlxError(e)) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse { message: format!("Database error: {}", e) })),
        _ => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse { message: "Internal Error.".to_string() })),
    }
}

// Handler for user login
pub async fn login_handler(
    State(pool): State<SqlitePool>,
    Extension(store): Extension<MemoryStore>,
    Json(payload): Json<LoginRequest>,
) -> (StatusCode, HeaderMap, Json<ApiResponse>) {
    match user::verify_user(&pool, &payload.username, &payload.password).await {
        Ok(true) => {
            let mut session = Session::new();
            session.insert("user", &payload.username).unwrap();
            let cookie = store.store_session(session).await.unwrap().unwrap();
            let mut headers = HeaderMap::new();
            headers.insert("Set-Cookie", HeaderValue::from_str(&format!("axum_session={}; Path=/; HttpOnly", cookie)).unwrap());
            (
                StatusCode::OK,
                headers,
                Json(ApiResponse { message: "Login successful".to_string() }),
            )
        }
        Ok(false) => (
            StatusCode::UNAUTHORIZED,
            HeaderMap::new(),
            Json(ApiResponse { message: "Invalid username or password".to_string() }),
        ),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            HeaderMap::new(),
            Json(ApiResponse { message: format!("Error during login: {}", err) }),
        ),
    }
}

// Handler for user logout
pub async fn logout_handler(
    Extension(store): Extension<MemoryStore>,
    headers: HeaderMap,
) -> (StatusCode, HeaderMap, Json<ApiResponse>) {
    let mut response_headers = HeaderMap::new();
    if let Some(cookie) = headers.typed_get::<Cookie>() {
        if let Some(session_cookie) = cookie.get("axum_session") {
            if let Some(session) = store.load_session(session_cookie.to_string()).await.unwrap() {
                let _ = store.destroy_session(session).await;
            }
            response_headers.insert("Set-Cookie", HeaderValue::from_static("axum_session=deleted; Path=/; Max-Age=0"));
        }
    }
    (
        StatusCode::OK,
        response_headers,
        Json(ApiResponse { message: "Logout successful.".to_string() }),
    )
}