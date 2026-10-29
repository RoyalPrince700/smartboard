import { Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/ApiError';
import { validateRequest } from '../middleware/errorHandler';
import {
  aiStatus,
  classifyContent,
  explainConcept,
  interpretBoard,
  recognizeHandwriting,
  solveMath,
  analyzeDiagram,
  visualizeMath,
} from '../controllers/aiController';

const router = Router();

router.get('/status', asyncHandler(aiStatus));

router.post(
  '/classify',
  [
    body('input').isString().trim().notEmpty().withMessage('Input is required'),
    body('subject').optional().isString(),
  ],
  validateRequest,
  asyncHandler(classifyContent)
);

router.post(
  '/explain',
  [
    body('input').isString().trim().notEmpty().withMessage('Input is required'),
    body('context').optional().isObject(),
    body('boardId').optional().isMongoId(),
  ],
  validateRequest,
  asyncHandler(explainConcept)
);

router.post(
  '/recognize',
  [
    body('strokes').optional().isArray(),
    body('imageBase64').optional().isString(),
    body('boardId').optional().isMongoId(),
  ],
  validateRequest,
  asyncHandler(recognizeHandwriting)
);

router.post(
  '/interpret',
  [
    body('text').optional().isString(),
    body('strokes').optional().isArray(),
    body('imageBase64').optional().isString(),
    body('context').optional().isObject(),
    body('boardId').optional().isMongoId(),
    body('explain').optional().isBoolean(),
  ],
  validateRequest,
  asyncHandler(interpretBoard)
);

router.post(
  '/solve',
  [
    body('input').optional().isString(),
    body('text').optional().isString(),
    body('strokes').optional().isArray(),
    body('imageBase64').optional().isString(),
    body('context').optional().isObject(),
    body('boardId').optional().isMongoId(),
    body('includeGraph').optional().isBoolean(),
  ],
  validateRequest,
  asyncHandler(solveMath)
);

router.post(
  '/visualize',
  [
    body('expression').optional().isString(),
    body('text').optional().isString(),
    body('strokes').optional().isArray(),
    body('imageBase64').optional().isString(),
    body('mode').optional().isIn(['function', 'geometry', 'diagram', 'auto']),
    body('xMin').optional().isNumeric(),
    body('xMax').optional().isNumeric(),
    body('boardId').optional().isMongoId(),
    body('context').optional().isObject(),
  ],
  validateRequest,
  asyncHandler(visualizeMath)
);

router.post(
  '/analyze-diagram',
  [
    body('strokes').optional().isArray(),
    body('text').optional().isString(),
    body('imageBase64').optional().isString(),
    body('context').optional().isObject(),
    body('boardId').optional().isMongoId(),
    body('generateDiagram').optional().isBoolean(),
  ],
  validateRequest,
  asyncHandler(analyzeDiagram)
);

export default router;
