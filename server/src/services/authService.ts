import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User  from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/auth';

const generateAccessToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
};

const generateRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Hết hạn sau 7 ngày

  await RefreshToken.create({ token, userId, expiresAt });
  return token;
};

export const register = async (data: RegisterRequest): Promise<AuthResponse & { refreshToken: string }> => {
  const { email, password, name } = data;
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new Error('Email already exists');
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashedPassword, name });
  const accessToken = generateAccessToken(user.id);
  const refreshToken = await generateRefreshToken(user.id);
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  };
};

export const login = async (data: LoginRequest): Promise<AuthResponse & { refreshToken: string }> => {
  const { email, password } = data;
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('Invalid email or password');
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Invalid email or password');
  const accessToken = generateAccessToken(user.id);
  const refreshToken = await generateRefreshToken(user.id);
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  const tokenRecord = await RefreshToken.findOne({ where: { token: refreshToken } });
  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }
  const user = await User.findByPk(tokenRecord.userId);
  if (!user) throw new Error('User not found');
  const newAccessToken = generateAccessToken(user.id);
  return { accessToken: newAccessToken };
};
