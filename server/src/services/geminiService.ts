import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const generateChatResponse = async (
  prompt: string,
  history: ChatMessage[] = []
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate chat response');
  }
};