import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES, LIMITS } from '../config/constants.js';

export const validate = (schema) => (req, res, next) => {
  // Enforce specific contract error codes for assessment limits
  if (req.body && typeof req.body.code === 'string' && Buffer.byteLength(req.body.code, 'utf-8') > LIMITS.MAX_CODE_SIZE_BYTES) {
    return next(new ApiError(413, ERROR_CODES.CODE_TOO_LARGE, 'Code payload exceeds maximum size limit of 64 KB (65,536 bytes)'));
  }
  if (req.body && typeof req.body.answerText === 'string' && req.body.answerText.length > LIMITS.MAX_ANSWER_TEXT_LENGTH) {
    return next(new ApiError(400, ERROR_CODES.ANSWER_TOO_LONG, 'Answer text exceeds maximum limit of 5,000 characters'));
  }
  if (req.body && typeof req.body.language === 'string' && req.body.language.toLowerCase() !== 'python') {
    return next(
      new ApiError(
        422,
        ERROR_CODES.UNSUPPORTED_LANGUAGE,
        `Unsupported language '${req.body.language}'. Week 3 supports python only.`
      )
    );
  }

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

