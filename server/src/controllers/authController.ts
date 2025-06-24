import { Request, Response } from 'express';
import { register, login, refreshAccessToken } from '../services/authService';
import { RegisterRequest, LoginRequest, RefreshTokenRequest } from '../types/auth';

export const registerController = async (req: Request, res: Response) => {
    try {
    const data: RegisterRequest = req.body;
    const result = await register(data);
    res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const loginController = async (req: Request, res: Response) => {
    try {
        const data: LoginRequest = req.body;
        const result = await login(data);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const { refreshToken }: RefreshTokenRequest = req.body;
    const result = await refreshAccessToken(refreshToken);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};