// server/src/routes/chatRoutes.ts
import { Router } from 'express';
import { chatController, getHistoryController, getConversationsController, deleteConversationController, renameConversationController, deleteMessageController, editMessageController, getFollowUpQuestionsController, getSuggestedProfileFromConversation, getSuggestedProfileFromMessage } from '../controllers/chatController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/chat', authMiddleware, chatController);
router.get('/chat/:conversationId', authMiddleware, getHistoryController);
router.get('/conversations', authMiddleware, getConversationsController);
router.delete('/conversations/:conversationId', authMiddleware, deleteConversationController);
router.patch('/conversations/:conversationId', authMiddleware, renameConversationController);
router.delete('/messages/:messageId', authMiddleware, deleteMessageController);
router.patch('/messages/:messageId', authMiddleware, editMessageController);
router.get('/chat/:conversationId/follow-up', authMiddleware, getFollowUpQuestionsController);

router.get("/profile/suggest-from-message/:messageId", authMiddleware, getSuggestedProfileFromMessage);
router.get("/profile/suggest-from-conversation/:conversationId", authMiddleware, getSuggestedProfileFromConversation);

export default router;