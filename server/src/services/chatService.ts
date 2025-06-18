import { generateChatResponse } from './geminiService';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { ChatRequest, ChatResponse } from '../types/auth';

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
      title: prompt.slice(0, 50), // Lấy 50 ký tự đầu làm tiêu đề
    });
  }

  // Lưu prompt của người dùng
  await Message.create({
    conversationId: conversation.id,
    content: prompt,
    role: 'user',
  });

  // Gọi Gemini API
  const response = await generateChatResponse(prompt);

  // Lưu phản hồi của assistant
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