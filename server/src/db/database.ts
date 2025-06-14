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

export default sequelize;