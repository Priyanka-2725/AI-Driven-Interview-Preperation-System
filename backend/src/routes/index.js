import { Router } from 'express';
import authRoutes from './authRoutes.js';
import systemRoutes from './systemRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/system', systemRoutes);

export default router;
