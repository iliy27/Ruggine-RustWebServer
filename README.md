# 🚀 Ruggine – A WebApp for Instant Messaging with a Rust Backend
For this personal project, I wanted to raise the bar and build something more ambitious — an application inspired by platforms like WhatsApp and Telegram, I named it Ruggine.

The project is split into two main components:
- **Client**: built with React, providing a clean and responsive user interface.
- **Server**: implemented in Rust, ensuring performance, safety, and reliability.

The app allows registered users to create private chats or group conversations and to send/read messages to/from other users. Invitations to chats or groups are managed through an invitation request system. Each user has an invitation inbox where requests arrive; once accepted, the user can participate in the corresponding chat or group.

## 🔗 Client-Server interaction
The client communicates with the Rust server in two ways:

- **REST APIs** – used for managing and retrieving static data such as:  
  - List of a user’s chats  
  - Pending invitations  
  - Message history within a chat
  - User authentication  
- **WebSockets** – used for **real-time messaging**, enabling near-instant sending and receiving of chat messages.

All the data exchanged are in **JSON format**.

This setup allowed me to practice full-stack development with a modern stack: React on the frontend and Rust powering the backend. The combination makes the application both fast and robust, while offering a smooth user experience.
## 🦀 Rust WebServer
The Rust server for Ruggine handles both REST API requests and WebSocket connections for real-time messaging. It follows a layered architecture with handlers for each entity (user, chat, messages) and repositories managing database access, ensuring modularity and maintainability. REST endpoints manage static data like chat lists, invitations, and message history, while WebSockets provide near-instant messaging with asynchronous handling via Tokio. Utilities include secure password hashing, custom error handling, and monitoring tools. Key Rust libraries include Axum and Tower-HTTP for the web framework, SQLx for database access, Serde for JSON serialization, and Bcrypt and Async-Session for authentication and session management.

