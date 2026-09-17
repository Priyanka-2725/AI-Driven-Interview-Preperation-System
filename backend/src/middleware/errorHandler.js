import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ERROR_CODES } from '../config/constants.js';
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || ERROR_CODES.INTERNAL_ERROR;
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    statusCode = 409;
    code = ERROR_CODES.EMAIL_ALREADY_REGISTERED;
    message = 'Email is already registered';
  }

  // Handle Mongoose validation errors fallback if not caught by Zod
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    details = Object.values(err.errors).map(val => ({
      field: val.path,
      issue: val.message
    }));
  }

  // Log error (only stack trace for internal server errors)
  if (statusCode >= 500) {
    logger.error(`[${code}] ${message}`, { requestId: req.requestId, stack: err.stack });
  } else {
    logger.warn(`[${code}] ${message}`, { requestId: req.requestId });
  }

  res.status(statusCode).json(ApiResponse.error(code, message, details, req.requestId));
};
