// server/src/services/chatService.ts
import { generateChatResponse } from "./geminiService";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import UserProfile from "../models/UserProfile";
import { ChatRequest, ChatResponse, ChatMessage } from "../types/auth";
import { keywordFilter, patternFilter } from "../utils/filters";
import { Op } from "sequelize";

const MAX_TOKENS = 1000;

const estimateTokens = (text: string) => {
  return Math.ceil(text.length / 4);
};

export const processChat = async (
  userId: string,
  { prompt, conversationId, systemPrompt, attachments }: ChatRequest
): Promise<ChatResponse> => {
  let conversation: any;
  if (conversationId) {
    conversation = await Conversation.findByPk(conversationId);
  } else {
    conversation = await Conversation.create({
      userId,
      title: prompt.slice(0, 50),
      systemPrompt,
    });
  }

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
      role: msg.role === "user" ? "user" : "model", // Đảm bảo đúng kiểu
      content: msg.content,
    } as ChatMessage); // Thêm ép kiểu rõ ràng
    totalTokens += msgTokens;
  }
}

  // ✅ Gộp nội dung file vào prompt
  let finalPrompt = prompt;
  if (attachments && attachments.length > 0) {
    const filesText = attachments
      .map(
        (file) =>
          `Tên file: ${file.name}\nNội dung:\n${file.content}\n---`
      )
      .join("\n");

    finalPrompt = `
Thông tin đính kèm từ file người dùng:
${filesText}
Trả lời câu hỏi sau dựa trên nội dung trên.
${prompt}
    `.trim();
  }

  const userMsg = await Message.create({
    conversationId: conversation.id,
    content:
      attachments && attachments.length > 0
        ? `[Đính kèm: ${attachments.map((a) => a.name).join(", ")}]\n${prompt}`
        : prompt,
    role: "user",
    attachments: attachments?.map((a) => a.name) || [],
  });

  const isMemoryWorthy = keywordFilter(prompt) || patternFilter(prompt);

  const replyText = await generateChatResponse(finalPrompt, history, conversation.systemPrompt);

  const assistantMsg = await Message.create({
    conversationId: conversation.id,
    content: replyText,
    role: "assistant",
  });

  return {
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    conversationId: conversation.id,
    memoryWorthyUserMessageId: isMemoryWorthy ? userMsg.id : undefined,
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

export const suggestProfileFromMessage = async (userId: string, messageId: string): Promise<string> => {
  const message = await Message.findOne({ where: { id: messageId }, include: [Conversation] });
  if (!message || message.role !== 'user') throw new Error("Invalid message");

  // Sửa lại để sử dụng MongoDB syntax
  const userProfile = await UserProfile.findOne({ userId });
  const profileData = JSON.stringify(userProfile?.data || {}, null, 2);

  const prompt = `
Bạn là một hệ thống hỗ trợ cập nhật hồ sơ người dùng (User Profile) từ nội dung hội thoại.

Dưới đây là hồ sơ hiện tại của người dùng dưới dạng JSON:
${profileData}

Tiếp theo là nội dung người dùng đã nói:
"${message.content}"

YÊU CẦU QUAN TRỌNG:
1. Phân tích thông tin mới từ tin nhắn người dùng
2. CHỈ BỔ SUNG hoặc CẬP NHẬT thông tin mới vào profile hiện tại
3. TUYỆT ĐỐI KHÔNG XÓA hoặc GHI ĐÈ thông tin cũ trừ khi có chỉ dẫn rõ ràng từ người dùng
4. Chỉ lưu thông tin dài hạn, liên quan đến cá nhân (tên, nghề nghiệp, sở thích, quê quán, mục tiêu...)
5. Bỏ qua thông tin tạm thời, ý kiến ngắn hạn

Chỉ phản hồi đúng định dạng JSON như sau (không giải thích, không markdown):

{
  "profile": {
    "Tên trường 1": "giá trị 1",
    "Tên trường 2": "giá trị 2",
  }
}

Nếu không có thông tin mới cần thêm, phản hồi y nguyên hồ sơ hiện tại:
{ "profile": ${profileData} }
`;

  const response = await generateChatResponse(prompt, []);
  return response;
};

export const suggestProfileFromConversation = async (userId: string, conversationId: string): Promise<string> => {
  const conversation = await Conversation.findOne({ where: { id: conversationId, userId } });
  if (!conversation) throw new Error("Conversation not found");

  const messages = await Message.findAll({
    where: { conversationId, role: 'user' },
    order: [['createdAt', 'ASC']],
    attributes: ['content'],
  });

  // Sửa lại để sử dụng MongoDB syntax
  const userProfile = await UserProfile.findOne({ userId });
  const profileData = JSON.stringify(userProfile?.data || {}, null, 2);

  let totalTokens = 0;
  let userContext = '';
  for (const msg of messages.reverse()) {
    const tokens = estimateTokens(msg.content);
    if (totalTokens + tokens > MAX_TOKENS) break;
    userContext = `${msg.content}\n${userContext}`;
    totalTokens += tokens;
  }

  const prompt = `
Bạn là một hệ thống hỗ trợ cập nhật hồ sơ người dùng (User Profile) từ nội dung hội thoại.

Dưới đây là hồ sơ hiện tại của người dùng dưới dạng JSON:
${profileData}

Tiếp theo là đoạn hội thoại người dùng đã nói:
${userContext}

YÊU CẦU QUAN TRỌNG:
1. Phân tích thông tin mới từ toàn bộ cuộc hội thoại
2. CHỈ BỔ SUNG hoặc CẬP NHẬT thông tin mới vào profile hiện tại
3. TUYỆT ĐỐI KHÔNG XÓA hoặc GHI ĐÈ thông tin cũ trừ khi có chỉ dẫn rõ ràng từ người dùng
4. Chỉ lưu thông tin dài hạn, liên quan đến cá nhân (tên, nghề nghiệp, sở thích, quê quán, mục tiêu...)
5. Bỏ qua thông tin tạm thời, ý kiến ngắn hạn

Chỉ phản hồi đúng định dạng JSON như sau (không giải thích, không markdown):

{
  "profile": {
    "Tên trường 1": "giá trị 1",
    "Tên trường 2": "giá trị 2",
  }
}

Nếu không có thông tin mới cần thêm, phản hồi y nguyên hồ sơ hiện tại:
{ "profile": ${profileData} }
`;

  const response = await generateChatResponse(prompt, []);
  return response;
};