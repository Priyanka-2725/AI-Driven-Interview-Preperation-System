import { z } from 'zod';
import { validate } from '../middleware/validate.js';

export const validateRecordingUpload = validate(z.object({
  body: z.object({
    durationSeconds: z.string().or(z.number()).transform(val => Number(val)).refine(val => val > 0 && val <= 300, {
      message: 'Recording duration must be between 1 and 300 seconds'
    })
  })
}));

export const validatePagination = validate(z.object({
  query: z.object({
    page: z.string().optional().transform(val => (val ? Number(val) : 1)),
    limit: z.string().optional().transform(val => (val ? Number(val) : 20))
  })
}));
