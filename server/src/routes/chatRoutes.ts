import { Router } from 'express';
import { chatController, getHistoryController } from '../controllers/chatController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/chat', authMiddleware, chatController);
router.get('/chat/:conversationId', authMiddleware, getHistoryController);

export default router;