import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { sequelize, initModels } from './db/database';
import authRoutes from './routes/authRoutes';
import protectedRoutes from './routes/protectedRoutes';
import chatRoutes from './routes/chatRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api', chatRoutes);

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