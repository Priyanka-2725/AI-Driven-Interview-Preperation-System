import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';

class TokenService {
  generateAccessToken(user) {
    return jwt.sign(
      { sub: user._id, role: user.role, type: 'access' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRY }
    );
  }

  generateRefreshToken(user) {
    const jti = uuidv4();
    const token = jwt.sign(
      { sub: user._id, type: 'refresh', jti },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY }
    );
    return { token, jti };
  }

  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async hashRefreshToken(token) {
    const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
    const hashInput = crypto.createHash('sha256').update(token).digest('hex');
    return await bcrypt.hash(hashInput, salt);
  }

  async compareRefreshToken(token, hash) {
    if (!hash) return false;
    const hashInput = crypto.createHash('sha256').update(token).digest('hex');
    return await bcrypt.compare(hashInput, hash);
  }
}

export default new TokenService();
