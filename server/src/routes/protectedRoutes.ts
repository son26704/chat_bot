import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

router.get('/protected', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json({ message: 'Protected route accessed', user: req.user });
});

export default router;