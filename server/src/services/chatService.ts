// server/src/services/chatService.ts
import { generateChatResponse } from "./geminiService";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import UserProfile from "../models/UserProfile";
import { ChatRequest, ChatResponse } from "../types/auth";
import { keywordFilter, patternFilter } from "../utils/filters";
import { Op } from "sequelize";

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
    throw new Error("Invalid conversation");
  }
  const messages = await Message.findAll({
    where: { conversationId: conversation.id },
    attributes: ["content", "role"],
    order: [["createdAt", "ASC"]],
  });
  let totalTokens = estimateTokens(prompt);
  const history = [];
  for (let i = messages.length - 1; i >= 0 && totalTokens < MAX_TOKENS; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content);
    if (totalTokens + msgTokens <= MAX_TOKENS) {
      history.unshift({
        role: (msg.role === "user" ? "user" : "model") as "user" | "model",
        content: msg.content,
      });
      totalTokens += msgTokens;
    }
  }
  await Message.create({
    conversationId: conversation.id,
    content: prompt,
    role: "user",
  });
  // Memory-worthy check
  const isMemoryWorthy = keywordFilter(prompt) || patternFilter(prompt);
  console.log(
    "🧠 Memory-worthy message?",
    isMemoryWorthy,
    "| Content:",
    prompt
  );
  if (isMemoryWorthy) {
    const profile = await UserProfile.findOne({ userId });
    console.log("🧠 USER PROFILE:", profile?.data || "Chưa có profile");
  }

  const response = await generateChatResponse(prompt, history);
  await Message.create({
    conversationId: conversation.id,
    content: response,
    role: "assistant",
  });
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
        attributes: ["id", "content", "role", "createdAt"],
        order: [["createdAt", "ASC"]],
      },
    ],
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
};

export const getUserConversations = async (userId: string) => {
  const conversations = await Conversation.findAll({
    where: { userId },
    attributes: ["id", "title", "createdAt", "updatedAt"],
    order: [["updatedAt", "DESC"]],
    include: [
      {
        model: Message,
        attributes: ["id", "content", "role", "createdAt"],
        limit: 1,
        order: [["createdAt", "DESC"]],
      },
    ],
  });

  return conversations;
};

export const deleteConversation = async (
  userId: string,
  conversationId: string
) => {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, userId },
  });

  if (!conversation) {
    throw new Error("Conversation not found or not authorized");
  }

  await Message.destroy({ where: { conversationId } });
  await conversation.destroy();
};

export const renameConversation = async (
  userId: string,
  conversationId: string,
  title: string
) => {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, userId },
  });
  if (!conversation)
    throw new Error("Conversation not found or not authorized");
  await conversation.update({ title, updatedAt: new Date() });
  return conversation;
};

export const deleteMessageAndBelow = async (
  userId: string,
  messageId: string
) => {
  // Lấy message cần xóa
  const message = await Message.findOne({ where: { id: messageId } });
  if (!message) throw new Error("Message not found");
  // Lấy conversation để kiểm tra quyền
  const conversation = await Conversation.findOne({
    where: { id: message.conversationId, userId },
  });
  if (!conversation)
    throw new Error("Not authorized or conversation not found");
  if (message.role !== "user")
    throw new Error("Only user messages can be deleted");
  // Xóa tất cả message có createdAt >= message.createdAt trong cùng conversation
  await Message.destroy({
    where: {
      conversationId: message.conversationId,
      createdAt: { [Op.gte]: message.createdAt },
    },
  });

  await conversation.update({ updatedAt: new Date() });
};

export const editMessageAndContinue = async (
  userId: string,
  messageId: string,
  newContent: string
): Promise<ChatResponse> => {
  // Lấy message cũ
  const oldMessage = await Message.findOne({ where: { id: messageId } });
  if (!oldMessage) throw new Error("Message not found");
  // Kiểm tra quyền
  const conversation = await Conversation.findOne({
    where: { id: oldMessage.conversationId, userId },
  });
  if (!conversation)
    throw new Error("Not authorized or conversation not found");
  if (oldMessage.role !== "user")
    throw new Error("Only user messages can be edited");
  // Xóa message cũ và các message bên dưới
  await Message.destroy({
    where: {
      conversationId: oldMessage.conversationId,
      createdAt: { [Op.gte]: oldMessage.createdAt },
    },
  });
  // Cập nhật updatedAt để đẩy lên đầu danh sách
  await conversation.update({ updatedAt: new Date() });
  // Gửi lại prompt mới
  const result = await processChat(userId, {
    prompt: newContent,
    conversationId: oldMessage.conversationId,
  });
  return result;
};

export const generateFollowUpQuestions = async (
  userId: string,
  conversationId: string
): Promise<string> => {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation || conversation.userId !== userId) {
    throw new Error("Invalid conversation");
  }

  const messages = await Message.findAll({
    where: { conversationId: conversation.id },
    attributes: ["content", "role"],
    order: [["createdAt", "ASC"]],
  });

  if (messages.length === 0) {
    throw new Error("No messages in conversation");
  }

  let totalTokens = 0;
  let rawConversation = "";
  for (let i = messages.length - 1; i >= 0 && totalTokens < MAX_TOKENS; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content);
    if (totalTokens + msgTokens <= MAX_TOKENS) {
      const role = msg.role === "user" ? "User" : "Assistant";
      rawConversation = `${role}: ${msg.content}\n` + rawConversation;
      totalTokens += msgTokens;
    }
  }

  const followUpPrompt = `
Dưới đây là đoạn hội thoại giữa người dùng và trợ lý:

${rawConversation}

Hãy gợi ý đúng 3 câu hỏi tiếp theo mà người dùng có thể hỏi, liên quan trực tiếp đến nội dung cuộc trò chuyện.

❗ Chỉ phản hồi đúng định dạng JSON như sau, không giải thích gì thêm:

{
  "suggestions": [
    "Câu hỏi gợi ý 1",
    "Câu hỏi gợi ý 2",
    "Câu hỏi gợi ý 3"
  ]
}
`;

  const response = await generateChatResponse(followUpPrompt, []);
  return response; // ✅ Trả về nguyên văn chuỗi JSON như mô hình phản hồi
};
