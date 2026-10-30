import express from 'express';
import {
  runCode,
  createSubmission,
  getSubmissionById,
  retrySubmission,
  listSubmissions
} from '../controllers/submissionController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  runRateLimiter,
  submissionRateLimiter
} from '../middleware/rateLimiters.js';
import {
  runCodeSchema,
  submitSchema
} from '../validators/assessmentValidators.js';

const router = express.Router();

router.post(
  '/run',
  authenticate,
  runRateLimiter,
  validate(runCodeSchema),
  runCode
);

router.post(
  '/',
  authenticate,
  submissionRateLimiter,
  validate(submitSchema),
  createSubmission
);

router.get('/', authenticate, listSubmissions);

router.get('/:id', authenticate, getSubmissionById);

router.post('/:id/retry', authenticate, retrySubmission);

export default router;
