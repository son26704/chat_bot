import { Router } from 'express';
import { chatController, getHistoryController, getConversationsController } from '../controllers/chatController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/chat', authMiddleware, chatController);
router.get('/chat/:conversationId', authMiddleware, getHistoryController);
router.get('/conversations', authMiddleware, getConversationsController);

export default router;