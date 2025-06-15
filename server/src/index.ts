import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { sequelize, initModels } from './db/database';
import authRoutes from './routes/authRoutes';
import dotenv from 'dotenv';
dotenv.config();

// Initialize environment variables
const app = express();
const PORT = process.env.PORT;

// Middleware setup
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Chat Bot Backend is running!');
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to PostgreSQL successful!');
    await initModels();
    console.log('Models synchronized!');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer();