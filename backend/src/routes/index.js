import { Router } from 'express';
import authRoutes from './authRoutes.js';
import systemRoutes from './systemRoutes.js';
import recordingRoutes from './recordingRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/system', systemRoutes);
router.use('/recordings', recordingRoutes);

export default router;
