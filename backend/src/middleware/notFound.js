import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';

export const notFound = (req, res, next) => {
  next(new ApiError(404, ERROR_CODES.ROUTE_NOT_FOUND, `Route not found: ${req.originalUrl}`));
};
