import { Router } from 'express';
import { body, param } from 'express-validator';
import { asyncHandler } from '../utils/ApiError';
import { validateRequest } from '../middleware/errorHandler';
import {
  agentMessage,
  agentStatus,
  getAgentSession,
  resetAgentSession,
} from '../controllers/agentController';

const router = Router();

router.get('/status', asyncHandler(agentStatus));

router.post(
  '/message',
  [
    body('message').isString().trim().notEmpty().withMessage('Message is required'),
    body('sessionId').optional().isString(),
    body('userId').optional().isString(),
    body('boardId').optional().isString(),
    body('subject').optional().isString(),
    body('topic').optional().isString(),
    body('difficulty').optional().isString(),
    body('teachingMode').optional().isString(),
  ],
  validateRequest,
  asyncHandler(agentMessage)
);

router.get(
  '/session/:sessionId',
  [param('sessionId').isString().notEmpty()],
  validateRequest,
  asyncHandler(getAgentSession)
);

router.delete(
  '/session/:sessionId',
  [param('sessionId').isString().notEmpty()],
  validateRequest,
  asyncHandler(resetAgentSession)
);

export default router;
