import {sequelize} from './database';
import User from '../models/User';

async function testUserModel() {
  try {
    await sequelize.authenticate();
    console.log('Connection to PostgreSQL successful!');

    // Tạo user mẫu
    const user = await User.create({
      email: 'test@example.com',
      password: 'testpassword',
      name: 'Test User',
    });
    console.log('User created:', user.toJSON());

    // Lấy tất cả user
    const users = await User.findAll();
    console.log('All users:', users.map((u) => u.toJSON()));
  } catch (error) {
    console.error('Error testing User model:', error);
  } finally {
    await sequelize.close();
  }
}

testUserModel();