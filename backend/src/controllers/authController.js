import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import authService from '../services/authService.js';
import tokenService from '../services/tokenService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';

const setRefreshCookie = (res, token) => {
  // 7 days in milliseconds
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: false, // secure=false in dev cookie named refreshToken
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge
  });
};

const clearRefreshCookie = (res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/api/v1/auth',
    expires: new Date(0)
  });
};

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  
  const accessToken = tokenService.generateAccessToken(user);
  const { token: refreshToken } = tokenService.generateRefreshToken(user);
  
  user.refreshTokenHash = await tokenService.hashRefreshToken(refreshToken);
  await user.save();
  
  setRefreshCookie(res, refreshToken);
  
  res.status(201).json(ApiResponse.success({ user, accessToken }, req.requestId));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUser(email, password);
  
  const accessToken = tokenService.generateAccessToken(user);
  const { token: refreshToken } = tokenService.generateRefreshToken(user);
  
  user.refreshTokenHash = await tokenService.hashRefreshToken(refreshToken);
  await user.save();
  
  setRefreshCookie(res, refreshToken);
  
  res.status(200).json(ApiResponse.success({ user, accessToken }, req.requestId));
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  
  if (!refreshToken) {
    throw new ApiError(401, ERROR_CODES.INVALID_TOKEN, 'No refresh token provided');
  }
  
  const decoded = tokenService.verifyRefreshToken(refreshToken);
  if (!decoded) {
    clearRefreshCookie(res);
    throw new ApiError(401, ERROR_CODES.TOKEN_EXPIRED, 'Refresh token is expired or invalid');
  }
  
  const user = await authService.getUserById(decoded.sub);
  // Need to fetch user with select('+refreshTokenHash') because it is select: false
  const userWithHash = await user.constructor.findById(user._id).select('+refreshTokenHash');
  
  const isValid = await tokenService.compareRefreshToken(refreshToken, userWithHash.refreshTokenHash);
  if (!isValid) {
    clearRefreshCookie(res);
    throw new ApiError(401, ERROR_CODES.INVALID_TOKEN, 'Refresh token is invalid or has been revoked');
  }
  
  // Rotate token
  const newAccessToken = tokenService.generateAccessToken(user);
  const { token: newRefreshToken } = tokenService.generateRefreshToken(user);
  
  userWithHash.refreshTokenHash = await tokenService.hashRefreshToken(newRefreshToken);
  await userWithHash.save();
  
  setRefreshCookie(res, newRefreshToken);
  
  res.status(200).json(ApiResponse.success({ accessToken: newAccessToken }, req.requestId));
});

export const logout = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);
  const userWithHash = await user.constructor.findById(user._id).select('+refreshTokenHash');
  
  userWithHash.refreshTokenHash = null;
  await userWithHash.save();
  
  clearRefreshCookie(res);
  
  res.status(200).json(ApiResponse.success({ message: 'Logged out successfully' }, req.requestId));
});

export const me = asyncHandler(async (req, res) => {
  // authenticate middleware attaches req.user
  res.status(200).json(ApiResponse.success({ user: req.user }, req.requestId));
});
