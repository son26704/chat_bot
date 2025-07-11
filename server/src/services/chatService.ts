import { generateChatResponse } from './geminiService';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { ChatRequest, ChatResponse } from '../types/auth';
import { Op } from 'sequelize';

const MAX_TOKENS = 1000;

const estimateTokens = (text: string) => {
  return Math.ceil(text.length / 4);
};

export const processChat = async (
  userId: string,
  { prompt, conversationId }: ChatRequest
): Promise<ChatResponse> => {
  let conversation = conversationId
    ? await Conversation.findByPk(conversationId)
    : await Conversation.create({ userId, title: prompt.slice(0, 50) });
  if (!conversation || conversation.userId !== userId) {
    throw new Error('Invalid conversation');
  }
  const messages = await Message.findAll({
    where: { conversationId: conversation.id },
    attributes: ['content', 'role'],
    order: [['createdAt', 'ASC']],
  });
  let totalTokens = estimateTokens(prompt);
  const history = [];
  for (let i = messages.length - 1; i >= 0 && totalTokens < MAX_TOKENS; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content);
    if (totalTokens + msgTokens <= MAX_TOKENS) {
      history.unshift({
        role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        content: msg.content,
      });
      totalTokens += msgTokens;
    }
  }
  await Message.create({ conversationId: conversation.id, content: prompt, role: 'user' });
  const response = await generateChatResponse(prompt, history);
  await Message.create({ conversationId: conversation.id, content: response, role: 'assistant' });
  return { response, conversationId: conversation.id };
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

export const deleteConversation = async (userId: string, conversationId: string) => {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, userId },
  });

  if (!conversation) {
    throw new Error('Conversation not found or not authorized');
  }

  await Message.destroy({ where: { conversationId } });
  await conversation.destroy();
};

export const renameConversation = async (userId: string, conversationId: string, title: string) => {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, userId },
  });
  if (!conversation) throw new Error('Conversation not found or not authorized');
  await conversation.update({ title });
  return conversation;
};