import { Request, Response } from 'express';
import { processChat, getConversationHistory, getUserConversations } from '../services/chatService';
import { AuthenticatedRequest, ChatRequest, ChatResponse } from '../types/auth';

export const chatController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, conversationId } = req.body as ChatRequest;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required and must be a string' });
    }
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const result: ChatResponse = await processChat(userId, { prompt, conversationId });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getHistoryController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const history = await getConversationHistory(userId, conversationId);
    res.status(200).json(history);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getConversationsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const conversations = await getUserConversations(userId);
    res.status(200).json(conversations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};