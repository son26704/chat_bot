# Chat Bot Application 🤖💬

A real-time chat application built with React, TypeScript, Node.js, Express, Socket.IO, and PostgreSQL, integrated with Google Gemini API for conversational AI.

## ✨ Features

- **🔐 User Authentication**: Register, login, and logout with JWT-based authentication
- **⚡ Real-time Chat**: Send and receive messages instantly using Socket.IO, with "AI is typing..." status
- **📝 Conversation Management**: Create, rename, delete, and continue conversations
- **🧠 Context-aware Chat**: Maintains conversation history for coherent responses
- **⚖️ Token Limit**: Restricts context to ~1000 tokens to optimize cost and speed
- **📱 Responsive UI**: Built with Ant Design for a modern, user-friendly interface

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Ant Design
- Socket.IO-client
- Axios
- React-Markdown

### Backend
- Node.js
- Express
- TypeScript
- Socket.IO
- Sequelize
- PostgreSQL

### AI & Database
- **AI**: Google Gemini API (gemini-1.5-flash)
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v13 or higher)
- **Google Gemini API key** (free tier available)

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/chat_bot.git
cd chat_bot
```

### 2. Backend Setup

Navigate to the server directory:
```bash
cd server
```

Install dependencies:
```bash
npm install
```

Set up environment variables by creating a `.env` file in `server/`:
```env
PORT=3000
JWT_SECRET=your_jwt_secret
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/chat_bot
GEMINI_API_KEY=your_gemini_api_key
```

> **Note**: Replace `<username>`, `<password>`, and `your_gemini_api_key` with your PostgreSQL credentials and Gemini API key.

Set up PostgreSQL database:
```bash
psql -U <username> -c "CREATE DATABASE chat_bot;"
```

> Sequelize will automatically create tables (Users, Conversations, Messages) on first run.

### 3. Frontend Setup

Navigate to the client directory:
```bash
cd ../client
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in `client/`:
```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Running the Application

**Start the backend:**
```bash
cd server
npm run dev
```
> The server runs on http://localhost:3000

**Start the frontend:**
```bash
cd ../client
npm run dev
```
> The frontend runs on http://localhost:5173

**Access the application:**
Open http://localhost:5173 in your browser and register or log in to start chatting.

## 🧪 Testing

### Manual Testing Checklist

- [ ] **Real-time Chat**: Send a message and verify "AI is typing..." appears, followed by a response from Gemini
- [ ] **Multi-tab Support**: Open multiple browser tabs, log in with the same account, and send messages to confirm updates across tabs
- [ ] **Conversation Management**: Create, rename, or delete conversations from the sidebar
- [ ] **Token Limit**: Send multiple long messages to ensure responses remain fast

## 📁 Project Structure

```
chat_bot/
├── client/                     # Frontend (React, TypeScript)
│   ├── src/
│   │   ├── pages/             # React components (LoginPage, ChatPage, etc.)
│   │   ├── services/          # API and Socket.IO services
│   │   ├── hooks/             # Custom hooks (useAuth)
│   │   ├── types/             # TypeScript interfaces
│   │   └── index.css          # Global styles
├── server/                     # Backend (Node.js, Express, TypeScript)
│   ├── src/
│   │   ├── controllers/       # API controllers
│   │   ├── db/                # Database configuration (Sequelize)
│   │   ├── models/            # Database models (User, Conversation, Message)
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic (auth, chat, Gemini)
│   │   ├── socket.ts          # Socket.IO configuration
│   │   └── index.ts           # Server entry point
└── README.md
```
