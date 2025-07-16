import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getUserProfileController, updateUserProfileController } from '../controllers/userProfileController';

const router = Router();

router.get('/profile', authMiddleware, getUserProfileController);
router.put('/profile', authMiddleware, updateUserProfileController);

export default router;
