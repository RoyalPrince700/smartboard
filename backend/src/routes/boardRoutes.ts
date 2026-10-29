import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../utils/ApiError';
import { validateRequest } from '../middleware/errorHandler';
import {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
} from '../controllers/boardController';

const router = Router();

router.post(
  '/',
  [
    body('title').optional().isString().trim().isLength({ max: 200 }),
    body('strokes').optional().isArray(),
    body('canvasSettings').optional().isObject(),
  ],
  validateRequest,
  asyncHandler(createBoard)
);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  asyncHandler(getBoards)
);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid board ID')],
  validateRequest,
  asyncHandler(getBoard)
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid board ID'),
    body('title').optional().isString().trim().isLength({ max: 200 }),
    body('strokes').optional().isArray(),
    body('canvasSettings').optional().isObject(),
  ],
  validateRequest,
  asyncHandler(updateBoard)
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid board ID')],
  validateRequest,
  asyncHandler(deleteBoard)
);

export default router;
