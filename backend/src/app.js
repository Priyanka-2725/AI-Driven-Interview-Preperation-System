import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import routes from './routes/index.js';
import { env } from './config/env.js';

const app = express();

// Middleware
app.use(requestId);
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Routes
app.use('/api/v1', routes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;
