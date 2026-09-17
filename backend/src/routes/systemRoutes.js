import { Router } from 'express';
import { health, mlHealth } from '../controllers/systemController.js';

const router = Router();

router.get('/health', health);
router.get('/ml-health', mlHealth);

export default router;
