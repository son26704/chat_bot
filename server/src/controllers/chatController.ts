import { Request, Response } from 'express';
import { generateChatResponse } from '../services/geminiService';
import { AuthenticatedRequest } from '../types/auth';

export const chatController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required and must be a string' });
    }
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const response = await generateChatResponse(prompt);
    res.status(200).json({ response });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};