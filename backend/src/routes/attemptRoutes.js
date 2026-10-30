import express from 'express';
import {
  createAttempt,
  getAttemptById,
  completeAttempt,
  listUserAttempts
} from '../controllers/attemptController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { createAttemptSchema } from '../validators/assessmentValidators.js';

const router = express.Router();

router.post('/', authenticate, validate(createAttemptSchema), createAttempt);
router.get('/', authenticate, listUserAttempts);
router.get('/:id', authenticate, getAttemptById);
router.post('/:id/complete', authenticate, completeAttempt);

export default router;
