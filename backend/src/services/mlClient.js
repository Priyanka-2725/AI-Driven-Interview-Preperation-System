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

import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

export const evaluateRecording = async (wavFilePath) => {
  try {
    const form = new FormData();
    form.append('audio', fs.createReadStream(wavFilePath), path.basename(wavFilePath));
    
    const response = await mlClient.post('/api/v1/evaluate', form, {
      headers: {
        ...form.getHeaders()
      },
      timeout: env.ML_EVALUATE_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    throw new ApiError(500, ERROR_CODES.ANALYSIS_FAILED, error.message || 'ML evaluation failed');
  }
};
