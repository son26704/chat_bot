import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'chatbot',
  username: 'postgres',
  password: process.env.DB_PASSWORD, 
});

import User from '../models/User';

const initModels = async () => {
  await User.sync();
}

export { sequelize, initModels };