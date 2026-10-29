import { Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/ApiError';
import { validateRequest } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { getCurrentUser, googleSignIn } from '../controllers/authController';

const router = Router();

router.post(
  '/google',
  [body('credential').isString().notEmpty().withMessage('Google credential is required')],
  validateRequest,
  asyncHandler(googleSignIn)
);

router.get('/me', requireAuth, asyncHandler(getCurrentUser));

export default router;
