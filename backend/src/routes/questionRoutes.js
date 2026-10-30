import express from 'express';
import {
  listQuestions,
  getQuestionById,
  generateQuestions
} from '../controllers/questionController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { generateQuestionsSchema } from '../validators/assessmentValidators.js';

const router = express.Router();

router.get('/', authenticate, listQuestions);
router.get('/:id', authenticate, getQuestionById);
router.post(
  '/generate',
  authenticate,
  validate(generateQuestionsSchema),
  generateQuestions
);

export default router;
