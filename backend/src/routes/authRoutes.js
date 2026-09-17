import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';
import rateLimit from 'express-rate-limit';
import { ERROR_CODES } from '../config/constants.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests from this IP, please try again later.',
        details: null
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
