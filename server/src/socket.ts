import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { processChat } from './services/chatService';
import { UserPayload, ChatRequest, ChatResponse } from './types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as UserPayload;
      socket.data.user = payload;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User ${socket.data.user.id} connected`);

    socket.join(`user:${socket.data.user.id}`);

    socket.on('send_message', async (data: ChatRequest, callback) => {
      try {
        const userId = socket.data.user.id;
        io.to(`user:${userId}`).emit('typing', { conversationId: data.conversationId });
        const result: ChatResponse = await processChat(userId, data);
        const response = {
          message: { id: Date.now().toString(), content: result.response, role: 'assistant', createdAt: new Date().toISOString() },
          conversationId: result.conversationId,
        };
        io.to(`user:${userId}`).emit('receive_message', response);
        callback({ success: true, data: response });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.data.user.id} disconnected`);
    });
  });

  return io;
};