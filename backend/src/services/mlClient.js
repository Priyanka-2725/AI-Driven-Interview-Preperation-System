import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
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
    throw new ApiError(
      503,
      ERROR_CODES.ML_SERVICE_UNAVAILABLE,
      'ML Service is currently unavailable'
    );
  }
};

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
    throw new ApiError(
      500,
      ERROR_CODES.ANALYSIS_FAILED,
      error.message || 'ML evaluation failed'
    );
  }
};

/**
 * Week 3: Question generation from ML service seed bank
 */
export const generateQuestionsFromMl = async ({
  topic,
  difficulty,
  type,
  count = 1,
  generateVariations = false,
  requestId
}) => {
  try {
    const headers = {};
    if (requestId) headers['X-Request-Id'] = requestId;

    const response = await mlClient.post(
      '/api/v1/assessment/generate-questions',
      {
        topic,
        difficulty,
        type,
        count,
        generateVariations
      },
      { headers }
    );
    return response.data;
  } catch (error) {
    if (
      !error.response ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND'
    ) {
      throw new ApiError(
        503,
        ERROR_CODES.ML_SERVICE_UNAVAILABLE,
        'ML Service is currently unavailable'
      );
    }
    const detail = error.response.data?.detail;
    throw new ApiError(
      error.response.status || 500,
      detail?.code || ERROR_CODES.INTERNAL_ERROR,
      detail?.message || 'Question generation failed'
    );
  }
};

/**
 * Week 3: Execute code against test cases (SubprocessCodeRunner)
 */
export const evaluateCodeInMl = async ({
  code,
  language = 'python',
  testCases,
  timeLimitSeconds = 3.0,
  visibleOnly = false,
  requestId
}) => {
  try {
    const headers = {};
    if (requestId) headers['X-Request-Id'] = requestId;

    const response = await mlClient.post(
      '/api/v1/assessment/evaluate-code',
      {
        code,
        language,
        testCases,
        timeLimitSeconds,
        visibleOnly
      },
      { headers }
    );
    return response.data;
  } catch (error) {
    if (
      !error.response ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND'
    ) {
      throw new ApiError(
        503,
        ERROR_CODES.ML_SERVICE_UNAVAILABLE,
        'ML Service is currently unavailable'
      );
    }
    const status = error.response.status;
    const detail = error.response.data?.detail;

    if (status === 408) {
      throw new ApiError(
        422,
        ERROR_CODES.EXECUTION_TIMEOUT,
        detail?.message || 'Cumulative code execution timed out'
      );
    }
    if (status === 422) {
      if (detail?.code === 'UNSUPPORTED_LANGUAGE') {
        throw new ApiError(
          422,
          ERROR_CODES.UNSUPPORTED_LANGUAGE,
          detail?.message || 'Unsupported language'
        );
      }
      throw new ApiError(
        422,
        ERROR_CODES.EXECUTION_ERROR,
        detail?.message || 'Code execution security or syntax violation'
      );
    }
    throw new ApiError(
      status,
      detail?.code || ERROR_CODES.INTERNAL_ERROR,
      detail?.message || 'Code evaluation failed'
    );
  }
};

/**
 * Week 3: Natural language conceptual answer evaluation (SBERT + spaCy)
 */
export const evaluateAnswerInMl = async ({
  questionText,
  referenceAnswer,
  keyConcepts,
  candidateAnswer,
  requestId
}) => {
  try {
    const headers = {};
    if (requestId) headers['X-Request-Id'] = requestId;

    const response = await mlClient.post(
      '/api/v1/assessment/evaluate-answer',
      {
        questionText,
        referenceAnswer,
        keyConcepts,
        candidateAnswer
      },
      { headers }
    );
    return response.data;
  } catch (error) {
    if (
      !error.response ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND'
    ) {
      throw new ApiError(
        503,
        ERROR_CODES.ML_SERVICE_UNAVAILABLE,
        'ML Service is currently unavailable'
      );
    }
    const detail = error.response.data?.detail;
    throw new ApiError(
      error.response.status || 500,
      detail?.code || ERROR_CODES.INTERNAL_ERROR,
      detail?.message || 'Answer evaluation failed'
    );
  }
};

/**
 * Week 3: Scoring aggregation (standard 0-100 score schema)
 */
export const scoreAssessmentInMl = async ({
  type,
  difficulty = 'medium',
  codingResult,
  nlpResult,
  requestId
}) => {
  try {
    const headers = {};
    if (requestId) headers['X-Request-Id'] = requestId;

    const response = await mlClient.post(
      '/api/v1/assessment/score',
      {
        type,
        difficulty,
        codingResult,
        nlpResult
      },
      { headers }
    );
    return response.data;
  } catch (error) {
    if (
      !error.response ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND'
    ) {
      throw new ApiError(
        503,
        ERROR_CODES.ML_SERVICE_UNAVAILABLE,
        'ML Service is currently unavailable'
      );
    }
    const detail = error.response.data?.detail;
    throw new ApiError(
      error.response.status || 500,
      detail?.code || ERROR_CODES.INTERNAL_ERROR,
      detail?.message || 'Scoring aggregation failed'
    );
  }
};
