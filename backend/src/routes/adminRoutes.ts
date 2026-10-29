import { Router } from 'express';
import { query } from 'express-validator';
import { asyncHandler } from '../utils/ApiError';
import { validateRequest } from '../middleware/errorHandler';
import { requireAdmin } from '../middleware/auth';
import { getAdminStats, listUsers } from '../controllers/adminController';

const router = Router();

router.use(requireAdmin);

router.get('/stats', asyncHandler(getAdminStats));

router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  asyncHandler(listUsers)
);

export default router;
