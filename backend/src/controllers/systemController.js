import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getMlHealth } from '../services/mlClient.js';

export const health = asyncHandler(async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  const healthData = {
    status: 'ok',
    uptimeSeconds: process.uptime(),
    database: dbStatus,
    version: '1.0.0'
  };
  
  res.status(200).json(ApiResponse.success(healthData, req.requestId));
});

export const mlHealth = asyncHandler(async (req, res) => {
  const mlServiceStatus = await getMlHealth();
  
  const healthData = {
    backend: 'online',
    mlService: mlServiceStatus ? 'online' : 'offline'
  };
  
  res.status(200).json(ApiResponse.success(healthData, req.requestId));
});
