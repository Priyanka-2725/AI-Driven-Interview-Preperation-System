import { z } from 'zod';
import { LIMITS } from '../config/constants.js';

const ALLOWED_TOPICS = [
  'arrays',
  'trees',
  'graphs',
  'strings',
  'system-design',
  'javascript',
  'python',
  'databases'
];

export const generateQuestionsSchema = z.object({
  topic: z.enum(ALLOWED_TOPICS).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  type: z.enum(['coding', 'conceptual']).optional(),
  count: z.coerce.number().min(1).max(LIMITS.MAX_TEST_CASES_PER_QUESTION).default(1),
  generateVariations: z.boolean().default(false)
});

export const runCodeSchema = z.object({
  questionId: z.string().optional(),
  code: z
    .string()
    .min(1, 'Code cannot be empty')
    .refine(
      (val) => Buffer.byteLength(val, 'utf-8') <= LIMITS.MAX_CODE_SIZE_BYTES,
      {
        message: 'Code payload exceeds maximum size limit of 64 KB (65,536 bytes)',
        path: ['code']
      }
    ),
  language: z.string().default('python'),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string()
      })
    )
    .max(LIMITS.MAX_TEST_CASES_PER_QUESTION)
    .optional()
});

export const submitSchema = z.object({
  questionId: z.string().min(1, 'questionId is required'),
  attemptId: z.string().optional().nullable(),
  type: z.enum(['coding', 'conceptual']),
  code: z
    .string()
    .refine(
      (val) => !val || Buffer.byteLength(val, 'utf-8') <= LIMITS.MAX_CODE_SIZE_BYTES,
      {
        message: 'Code payload exceeds maximum size limit of 64 KB (65,536 bytes)',
        path: ['code']
      }
    )
    .optional(),
  language: z.string().default('python'),
  answerText: z
    .string()
    .max(LIMITS.MAX_ANSWER_TEXT_LENGTH, 'Answer text exceeds maximum limit of 5,000 characters')
    .optional()
});

export const createAttemptSchema = z.object({
  questionIds: z.array(z.string()).min(1).max(10).optional(),
  topic: z.enum(ALLOWED_TOPICS).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  count: z.coerce.number().min(1).max(10).default(3)
});
