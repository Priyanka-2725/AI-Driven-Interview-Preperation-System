import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';

class AuthService {
  async registerUser(userData) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(409, ERROR_CODES.EMAIL_ALREADY_REGISTERED, 'Email is already registered');
    }

    const user = new User({
      fullName: userData.fullName,
      email: userData.email,
      passwordHash: userData.password, // Hook will hash it
      targetRole: userData.targetRole,
      experienceLevel: userData.experienceLevel
    });

    await user.save();
    return user;
  }

  async loginUser(email, password) {
    // Both wrong email and wrong password return INVALID_CREDENTIALS
    // We add '+passwordHash' because it's set to select: false in the schema
    const user = await User.findOne({ email }).select('+passwordHash');
    
    if (!user) {
      throw new ApiError(401, ERROR_CODES.INVALID_CREDENTIALS, 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, ERROR_CODES.INVALID_CREDENTIALS, 'Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await user.save();

    return user;
  }

  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, ERROR_CODES.USER_NOT_FOUND, 'User not found');
    }
    return user;
  }
}

export default new AuthService();
