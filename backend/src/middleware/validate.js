import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      issue: issue.message
    }));
    return next(new ApiError(400, ERROR_CODES.VALIDATION_ERROR, 'Validation failed', details));
  }
  req.body = result.data;
  next();
};
