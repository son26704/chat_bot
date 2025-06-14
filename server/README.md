# Chat Bot Backend

A Node.js backend API built with TypeScript, Express.js, Sequelize, and PostgreSQL.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a PostgreSQL database named `chat_bot_db`

4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=chat_bot_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   NODE_ENV=development
   ```

## Running the Application

Development mode:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── models/         # Database models
├── routes/         # API routes
├── middlewares/    # Custom middlewares
├── utils/          # Utility functions
└── index.ts       # Application entry point
```

## API Endpoints

- GET `/`: Welcome message
