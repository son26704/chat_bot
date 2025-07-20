// server/src/index.ts
import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { sequelize, initModels } from './db/database';
import { connectMongo } from './db/mongodb';
import authRoutes from './routes/authRoutes';
import protectedRoutes from './routes/protectedRoutes';
import chatRoutes from './routes/chatRoutes';
import userRoutes from './routes/userRoutes';
import searchWebRouter from "./routes/searchWeb";
import { createServer } from 'http';
import { initSocket } from './socket';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
const httpServer = createServer(app);

app.use('/api/auth', authRoutes);
app.use('/api', chatRoutes);
app.use('/api', userRoutes);
app.use('/api', protectedRoutes);
app.use("/api/search-web", searchWebRouter);

app.get('/', (req, res) => {
  res.send('Chat Bot Backend is running!');
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to PostgreSQL successful!');
    await initModels();
    await connectMongo();
    console.log('Models synchronized!');
    const io = initSocket(httpServer);
    console.log('Socket.io initialized!');
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer();