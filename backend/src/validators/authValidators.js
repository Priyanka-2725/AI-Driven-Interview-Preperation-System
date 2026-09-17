import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one digit');

export const registerSchema = z.object({
  fullName: z.string().min(2).max(80).trim(),
  email: z.string().email('Please fill a valid email address').toLowerCase().trim(),
  password: passwordSchema,
  targetRole: z.string().max(80).optional().nullable(),
  experienceLevel: z.enum(['fresher', 'junior', 'mid', 'senior']).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Please fill a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
});
