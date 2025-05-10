# Chat App Backend (Node.js + WebSocket + MongoDB + JWT)

This is the backend for a real-time chat application using WebSockets, JWT authentication, and MongoDB for message persistence.

## 🚀 Features

- JWT-based user authentication
- WebSocket-based real-time messaging
- Message history persistence in MongoDB
- Broadcast to all connected users
- Secure message sending (only authenticated users)

## 📦 Requirements

- Node.js (v18+)
- MongoDB (local or Atlas)
-  "bcrypt": "^5.1.1",
-   "cors": "^2.8.5",
-  "crypto": "^1.0.1",
-  "crypto": "^1.0.1",
-  "dotenv": "^16.5.0",
-  "express": "^5.1.0",
-  "jsonwebtoken": "^9.0.2",
-  "mongoose": "^8.14.1",
-  "nodemon": "^3.1.10",
-  "uuid": "^11.1.0",
-  "ws": "^8.18.2"

## 📁 Project Structure

backend/
- config/db.js # MongoDb atlas configueration
- routes/auth.js # Auth route (login/register)
- models/ChatMessage.js # Mongoose schema for chat messages
- models/User.js # Mongoose schema for login and registered user
- webSocket.js # WebSocket server
- .env # Environment config (Mongo URI, JWT secret)
