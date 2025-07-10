import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'chatbot',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  logging: false, 
});

import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import Conversation from '../models/Conversation';
import Message from '../models/Message';

const initModels = async () => {
  try {
    await User.sync();
    await RefreshToken.sync();
    await Conversation.sync();
    await Message.sync();
    console.log('Database models synchronized');
  } catch (error) {
    console.error('Failed to sync models:', error);
    throw error;
  }
};

export { sequelize, initModels };