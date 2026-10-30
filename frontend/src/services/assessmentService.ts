import { apiClient } from './apiClient';
import { ApiResponse } from '../types/api.types';
import {
  Question,
  Submission,
  Attempt,
  RunCodeResult,
  Topic,
  Difficulty,
  QuestionType,
} from '../types/assessment.types';

export interface QuestionFilters {
  topic?: Topic | '';
  difficulty?: Difficulty | '';
  type?: QuestionType | '';
  page?: number;
  limit?: number;
}

export interface QuestionListResponse {
  questions: Question[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface SubmissionListResponse {
  submissions: Submission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface AttemptListResponse {
  attempts: Attempt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export const assessmentService = {
  /**
   * Fetch questions with optional filters (topic, difficulty, type, pagination)
   */
  async getQuestions(filters?: QuestionFilters): Promise<QuestionListResponse> {
    const params = new URLSearchParams();
    if (filters?.topic) params.append('topic', filters.topic);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ApiResponse<QuestionListResponse>>(
      `/questions?${params.toString()}`
    );
    if (!response.data.data) {
      throw new Error('Failed to retrieve questions');
    }
    return response.data.data;
  },

  /**
   * Get single question by ID or slug
   */
  async getQuestionById(idOrSlug: string): Promise<Question> {
    const response = await apiClient.get<ApiResponse<{ question: Question }>>(
      `/questions/${encodeURIComponent(idOrSlug)}`
    );
    if (!response.data.data?.question) {
      throw new Error('Question not found');
    }
    return response.data.data.question;
  },

  /**
   * Generate or select a question variation dynamically
   */
  async generateQuestion(params: {
    topic: Topic;
    difficulty: Difficulty;
    type?: QuestionType;
  }): Promise<Question> {
    const response = await apiClient.post<ApiResponse<{ question: Question }>>(
      '/questions/generate',
      params
    );
    if (!response.data.data?.question) {
      throw new Error('Failed to generate question');
    }
    return response.data.data.question;
  },

  /**
   * Run code against visible test cases only (non-graded execution)
   */
  async runCode(payload: {
    questionId?: string;
    code: string;
    language?: string;
    testCases?: Array<{ input: string; expectedOutput: string }>;
  }): Promise<RunCodeResult> {
    const response = await apiClient.post<ApiResponse<RunCodeResult>>(
      '/submissions/run',
      {
        questionId: payload.questionId,
        code: payload.code,
        language: payload.language || 'python',
        testCases: payload.testCases,
      }
    );
    if (!response.data.data) {
      throw new Error('Code execution returned empty result');
    }
    return response.data.data;
  },

  /**
   * Submit code or conceptual answer for full evaluation
   */
  async submitAnswer(payload: {
    questionId: string;
    attemptId?: string | null;
    type: QuestionType;
    code?: string | null;
    language?: string;
    answerText?: string | null;
  }): Promise<Submission> {
    const response = await apiClient.post<ApiResponse<{ submission: Submission }>>(
      '/submissions',
      payload
    );
    if (!response.data.data?.submission) {
      throw new Error('Failed to submit assessment answer');
    }
    return response.data.data.submission;
  },

  /**
   * Retry evaluation for a failed or pending submission
   */
  async retrySubmission(submissionId: string): Promise<Submission> {
    const response = await apiClient.post<ApiResponse<{ submission: Submission }>>(
      `/submissions/${submissionId}/retry`
    );
    if (!response.data.data?.submission) {
      throw new Error('Failed to retry submission evaluation');
    }
    return response.data.data.submission;
  },

  /**
   * Get single submission by ID with populated evaluation
   */
  async getSubmissionById(submissionId: string): Promise<Submission> {
    const response = await apiClient.get<ApiResponse<{ submission: Submission }>>(
      `/submissions/${submissionId}`
    );
    if (!response.data.data?.submission) {
      throw new Error('Submission not found');
    }
    return response.data.data.submission;
  },

  /**
   * List past user submissions
   */
  async getUserSubmissions(params?: { page?: number; limit?: number }): Promise<SubmissionListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const response = await apiClient.get<ApiResponse<SubmissionListResponse>>(
      `/submissions?${query.toString()}`
    );
    if (!response.data.data) {
      throw new Error('Failed to retrieve submissions');
    }
    return response.data.data;
  },

  /**
   * Start a new multi-question technical attempt session
   */
  async createAttempt(params: {
    topic: Topic;
    difficulty: Difficulty;
    questionCount?: number;
  }): Promise<Attempt> {
    const response = await apiClient.post<ApiResponse<{ attempt: Attempt }>>(
      '/attempts',
      params
    );
    if (!response.data.data?.attempt) {
      throw new Error('Failed to create attempt session');
    }
    return response.data.data.attempt;
  },

  /**
   * List candidate's past attempts
   */
  async getUserAttempts(params?: { page?: number; limit?: number }): Promise<AttemptListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const response = await apiClient.get<ApiResponse<AttemptListResponse>>(
      `/attempts?${query.toString()}`
    );
    if (!response.data.data) {
      throw new Error('Failed to retrieve attempts');
    }
    return response.data.data;
  },

  /**
   * Get attempt details by ID including submissions and question list
   */
  async getAttemptById(attemptId: string): Promise<Attempt> {
    const response = await apiClient.get<ApiResponse<{ attempt: Attempt }>>(
      `/attempts/${attemptId}`
    );
    if (!response.data.data?.attempt) {
      throw new Error('Attempt not found');
    }
    return response.data.data.attempt;
  },
};
