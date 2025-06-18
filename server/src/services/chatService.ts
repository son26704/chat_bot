import { generateChatResponse } from './geminiService';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { ChatRequest, ChatResponse } from '../types/auth';
import { Op } from 'sequelize';

export const processChat = async (
  userId: string,
  { prompt, conversationId }: ChatRequest
): Promise<ChatResponse> => {
  let conversation;

  if (conversationId) {
    conversation = await Conversation.findByPk(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error('Invalid conversation');
    }
  } else {
    conversation = await Conversation.create({
      userId,
      title: prompt.slice(0, 50),
    });
  }

  // Lấy lịch sử tin nhắn
  const messages = await Message.findAll({
    where: { conversationId: conversation.id },
    attributes: ['content', 'role'],
    order: [['createdAt', 'ASC']],
  });

  // Chuyển đổi lịch sử thành định dạng Gemini
  const history = messages.map((msg) => ({
    role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
    content: msg.content,
  }));

  // Lưu prompt của người dùng
  await Message.create({
    conversationId: conversation.id,
    content: prompt,
    role: 'user',
  });

  // Gọi Gemini API với lịch sử
  const response = await generateChatResponse(prompt, history);

  // Lưu phản hồi
  await Message.create({
    conversationId: conversation.id,
    content: response,
    role: 'assistant',
  });

  return {
    response,
    conversationId: conversation.id,
  };
};

export const getConversationHistory = async (
  userId: string,
  conversationId: string
) => {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, userId },
    include: [
      {
        model: Message,
        attributes: ['id', 'content', 'role', 'createdAt'],
        order: [['createdAt', 'ASC']],
      },
    ],
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  return conversation;
};

export const getUserConversations = async (userId: string) => {
  const conversations = await Conversation.findAll({
    where: { userId },
    attributes: ['id', 'title', 'createdAt', 'updatedAt'],
    order: [['updatedAt', 'DESC']],
    include: [
      {
        model: Message,
        attributes: ['id', 'content', 'role', 'createdAt'],
        limit: 1,
        order: [['createdAt', 'DESC']],
      },
    ],
  });

  return conversations;
};