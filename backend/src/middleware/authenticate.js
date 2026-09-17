import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import { env } from '../config/env.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, ERROR_CODES.MISSING_TOKEN, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      const user = await User.findById(decoded.sub);
      if (!user || !user.isActive) {
        throw new ApiError(401, ERROR_CODES.INVALID_TOKEN, 'User no longer exists or is inactive');
      }

      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, ERROR_CODES.TOKEN_EXPIRED, 'Access token has expired');
      }
      throw new ApiError(401, ERROR_CODES.INVALID_TOKEN, 'Invalid access token');
    }
  } catch (error) {
    next(error);
  }
};
