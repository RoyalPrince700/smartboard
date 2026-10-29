import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import boardRoutes from './boardRoutes';
import aiRoutes from './aiRoutes';
import agentRoutes from './agentRoutes';
import adminRoutes from './adminRoutes';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/boards', optionalAuth, boardRoutes);
router.use('/ai', aiRoutes);
router.use('/agent', agentRoutes);

export default router;
