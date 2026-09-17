import axios from 'axios';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';

const mlClient = axios.create({
  baseURL: env.ML_SERVICE_URL,
  timeout: env.ML_SERVICE_TIMEOUT_MS
});

export const getMlHealth = async () => {
  try {
    const response = await mlClient.get('/health');
    return response.data;
  } catch (error) {
    throw new ApiError(503, ERROR_CODES.ML_SERVICE_UNAVAILABLE, 'ML Service is currently unavailable');
  }
};
