use std::net::SocketAddr;
use sqlx::sqlite::SqlitePoolOptions;
use tower_http::cors::{CorsLayer};
use axum::http::{header, Method};

mod routes;
mod db_mapper;
mod utilities;
mod route_handlers;


#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {

    // Configure the CORS (Cross-Origin Resource Sharing) middleware using CorsLayer.
    // This middleware defines the rules for allowing cross-origin requests to the server.
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:5173".parse::<axum::http::HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE])
        .allow_credentials(true);

    // Create a new SQLite connection pool using SqlitePoolOptions.
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite://Ruggine.db")
        .await?;
    
    println!("Connected to the db!");
    
    // Create the router
    let app = routes::create_routes(pool.clone()).await.layer(cors);

    // Define the address to run the server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));

    // Start the monitor thread for the CPU usage
    utilities::monitor::start_monitoring();

    // Start the Axum server to handle incoming HTTP requests.
    axum::serve(tokio::net::TcpListener::bind(addr).await?, app).await?;
    println!("Server running at http://{}", addr);
    Ok(())
}
