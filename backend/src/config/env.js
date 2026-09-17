import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  MONGODB_URI: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).default('12'),
  CORS_ORIGIN: z.string().url(),
  ML_SERVICE_URL: z.string().url(),
  ML_SERVICE_TIMEOUT_MS: z.string().transform(Number).default('10000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Environment variable validation failed:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
