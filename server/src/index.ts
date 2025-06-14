import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
// import sequelize from "./db/database";

dotenv.config();

const app: Application = express();
const port = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
// sequelize
//   .authenticate()
//   .then(() => {
//     console.log("Database connection has been established successfully.");
//   })
//   .catch((error) => {
//     console.error("Unable to connect to the database:", error);
//   });

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Chat Bot API" });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
