import { Router } from 'express';
import { chatController, getHistoryController, getConversationsController, deleteConversationController, renameConversationController, deleteMessageController, editMessageController } from '../controllers/chatController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/chat', authMiddleware, chatController);
router.get('/chat/:conversationId', authMiddleware, getHistoryController);
router.get('/conversations', authMiddleware, getConversationsController);
router.delete('/conversations/:conversationId', authMiddleware, deleteConversationController);
router.patch('/conversations/:conversationId', authMiddleware, renameConversationController);
router.delete('/messages/:messageId', authMiddleware, deleteMessageController);
router.patch('/messages/:messageId', authMiddleware, editMessageController);

export default router;