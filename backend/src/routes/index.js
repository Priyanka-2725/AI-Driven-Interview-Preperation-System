import { Router } from 'express';
import authRoutes from './authRoutes.js';
import systemRoutes from './systemRoutes.js';
import recordingRoutes from './recordingRoutes.js';
import questionRoutes from './questionRoutes.js';
import submissionRoutes from './submissionRoutes.js';
import attemptRoutes from './attemptRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/system', systemRoutes);
router.use('/recordings', recordingRoutes);
router.use('/questions', questionRoutes);
router.use('/submissions', submissionRoutes);
router.use('/attempts', attemptRoutes);

export default router;
