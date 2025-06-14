import sequelize from './database';

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection to PostgreSQL successful!');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();