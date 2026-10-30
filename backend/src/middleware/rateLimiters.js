import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES, LIMITS } from '../config/constants.js';

export const submissionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: LIMITS.SUBMISSION_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        ERROR_CODES.SUBMISSION_RATE_LIMIT_EXCEEDED,
        'Exceeded maximum rate limit of 10 submissions per minute'
      )
    );
  }
});

export const runRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: LIMITS.RUN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        ERROR_CODES.RUN_RATE_LIMIT_EXCEEDED,
        'Exceeded maximum rate limit of 20 runs per minute'
      )
    );
  }
});
