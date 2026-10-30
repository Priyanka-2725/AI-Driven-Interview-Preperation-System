import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TechnicalResultsPage } from '../pages/TechnicalResultsPage';
import { AssessmentErrorBanner } from '../components/assessment/AssessmentErrorBanner';
import { ConceptualAnswerEditor } from '../components/assessment/ConceptualAnswerEditor';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { assessmentService } from '../services/assessmentService';
import * as authHook from '../hooks/useAuth';
import type { Submission } from '../types/assessment.types';

// Mock assessmentService
vi.mock('../services/assessmentService', () => ({
  assessmentService: {
    getSubmissionById: vi.fn(),
    retrySubmission: vi.fn(),
  },
}));

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('Automated UI Tests - Assessment & Security Requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Requirement 4(a): Hidden tests render only as "Hidden test passed/failed"
   * with NO input/output payloads in the DOM.
   */
  describe('4(a) Hidden test cases privacy and DOM rendering', () => {
    const mockSubmission: Submission = {
      _id: 'sub-test-hidden-1',
      id: 'sub-test-hidden-1',
      userId: 'user-abc',
      questionId: 'two-sum',
      questionTitle: 'Two Sum',
      type: 'coding',
      questionCategory: 'coding',
      questionDifficulty: 'easy',
      code: 'def two_sum(nums, target): return [0, 1]',
      language: 'python',
      status: 'passed',
      score: 95,
      rubricScores: {
        correctness: 95,
        timeComplexity: 90,
        spaceComplexity: 90,
        codeQuality: 95,
      },
      detailedFeedback: {
        overview: 'Good execution',
        correctness: 'Passed visible and hidden suites',
        timeComplexity: 'Optimal linear lookup',
        spaceComplexity: 'Auxiliary hash map',
        codeQuality: 'Well styled',
        suggestions: [],
      },
      evaluation: {
        score: 95,
        testResults: [
          {
            testIndex: 0,
            passed: true,
            isHidden: false,
            input: 'nums=[2,7,11,15], target=9',
            expectedOutput: '[0, 1]',
            actualOutput: '[0, 1]',
            runtimeMs: 12.0,
          },
          {
            testIndex: 1,
            passed: true,
            isHidden: true,
            input: 'SECRET_PAYLOAD_INPUT_PASSED_XYZ999',
            expectedOutput: 'SECRET_EXPECTED_OUTPUT_PASSED_XYZ999',
            actualOutput: 'SECRET_ACTUAL_OUTPUT_PASSED_XYZ999',
            runtimeMs: 14.5,
          },
          {
            testIndex: 2,
            passed: false,
            isHidden: true,
            input: 'SECRET_PAYLOAD_INPUT_FAILED_EDGE_CASE_888',
            expectedOutput: 'SECRET_EXPECTED_OUTPUT_FAILED_EDGE_CASE_888',
            actualOutput: 'SECRET_ACTUAL_OUTPUT_FAILED_EDGE_CASE_888',
            runtimeMs: 16.2,
          },
        ],
      },
      createdAt: new Date().toISOString(),
    };

    it('renders "Hidden test passed" and "Hidden test failed" without disclosing input/output in the DOM', async () => {
      vi.mocked(assessmentService.getSubmissionById).mockResolvedValue(mockSubmission);

      render(
        <MemoryRouter initialEntries={['/technical/results/sub-test-hidden-1']}>
          <Routes>
            <Route path="/technical/results/:id" element={<TechnicalResultsPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for submission details to load
      await waitFor(() => {
        expect(screen.getByText('Technical Evaluation Report')).toBeInTheDocument();
      });

      // 1. Verify visible sample test renders its input and expected output in the DOM
      expect(screen.getByText('Passed')).toBeInTheDocument();
      expect(screen.getByText(/nums=\[2,7,11,15\], target=9/)).toBeInTheDocument();
      expect(screen.getAllByText('[0, 1]').length).toBeGreaterThanOrEqual(1);

      // 2. Verify hidden tests display only the masked pass/fail indicators
      expect(screen.getByText('Hidden test passed')).toBeInTheDocument();
      expect(screen.getByText('Hidden test failed')).toBeInTheDocument();

      // 3. Crucial privacy guarantee: NO secret hidden inputs or outputs exist anywhere in the DOM
      expect(screen.queryByText(/SECRET_PAYLOAD_INPUT_PASSED_XYZ999/)).not.toBeInTheDocument();
      expect(screen.queryByText(/SECRET_EXPECTED_OUTPUT_PASSED_XYZ999/)).not.toBeInTheDocument();
      expect(screen.queryByText(/SECRET_ACTUAL_OUTPUT_PASSED_XYZ999/)).not.toBeInTheDocument();

      expect(screen.queryByText(/SECRET_PAYLOAD_INPUT_FAILED_EDGE_CASE_888/)).not.toBeInTheDocument();
      expect(screen.queryByText(/SECRET_EXPECTED_OUTPUT_FAILED_EDGE_CASE_888/)).not.toBeInTheDocument();
      expect(screen.queryByText(/SECRET_ACTUAL_OUTPUT_FAILED_EDGE_CASE_888/)).not.toBeInTheDocument();
    });
  });

  /**
   * Requirement 4(b): 503 shows the Retry button and clicking it calls /submissions/:id/retry
   */
  describe('4(b) 503 ML Service Unavailable & Retry invocation', () => {
    it('shows the 503 banner with Retry button and triggers retry callback with submissionId', async () => {
      const user = userEvent.setup();
      const mockOnRetry = vi.fn();

      render(
        <AssessmentErrorBanner
          error={{
            statusCode: 503,
            code: 'ML_SERVICE_UNAVAILABLE',
            message: 'ML Service is temporarily down for maintenance',
            submissionId: 'sub-retry-test-503',
          }}
          onRetry={mockOnRetry}
          isRetrying={false}
        />
      );

      // Verify 503 banner message
      expect(screen.getByText('ML Service Temporarily Unavailable')).toBeInTheDocument();

      // Verify Retry button is visible
      const retryBtn = screen.getByRole('button', { name: /retry evaluation/i });
      expect(retryBtn).toBeInTheDocument();
      expect(retryBtn).not.toBeDisabled();

      // Click the retry button
      await user.click(retryBtn);

      // Verify onRetry was called with the exact submissionId
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      expect(mockOnRetry).toHaveBeenCalledWith('sub-retry-test-503');
    });

    it('invokes assessmentService.retrySubmission which calls /submissions/:id/retry endpoint', async () => {
      const user = userEvent.setup();
      const mockFailedSubmission: Submission = {
        _id: 'sub-retry-503',
        id: 'sub-retry-503',
        userId: 'user-abc',
        questionId: 'two-sum',
        questionTitle: 'Two Sum',
        questionCategory: 'coding',
        questionDifficulty: 'easy',
        code: 'def two_sum(): pass',
        language: 'python',
        status: 'failed',
        error: 'ML service unavailable. Evaluation queued for retry.',
        createdAt: new Date().toISOString(),
      };

      vi.mocked(assessmentService.getSubmissionById).mockResolvedValue(mockFailedSubmission);
      vi.mocked(assessmentService.retrySubmission).mockResolvedValue({
        ...mockFailedSubmission,
        status: 'passed',
        score: 90,
      });

      render(
        <MemoryRouter initialEntries={['/technical/results/sub-retry-503']}>
          <Routes>
            <Route path="/technical/results/:id" element={<TechnicalResultsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ML Service Temporarily Unavailable')).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole('button', { name: /retry evaluation/i });
      expect(retryBtn).toBeInTheDocument();

      await act(async () => {
        await user.click(retryBtn);
      });

      expect(assessmentService.retrySubmission).toHaveBeenCalledTimes(1);
      expect(assessmentService.retrySubmission).toHaveBeenCalledWith('sub-retry-503');
    });
  });

  /**
   * Requirement 4(c): 429 Rate Limit and 413 Payload Too Large banners
   */
  describe('4(c) 429 and 413 error banner alerts', () => {
    it('renders 429 Rate Limit Exceeded banner', () => {
      render(
        <AssessmentErrorBanner
          error={{
            statusCode: 429,
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
          }}
        />
      );

      expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument();
      expect(
        screen.getByText(/You have reached the temporary rate limit \(10 submits\/min, 20 runs\/min\)/)
      ).toBeInTheDocument();
    });

    it('renders 413 Payload Too Large banner (64 KB limit)', () => {
      render(
        <AssessmentErrorBanner
          error={{
            statusCode: 413,
            code: 'CODE_TOO_LARGE',
            message: 'Submitted code exceeds 65,536 bytes limit',
          }}
        />
      );

      expect(screen.getByText('Payload Too Large (64 KB Limit)')).toBeInTheDocument();
      expect(
        screen.getByText(/Your submitted code exceeds 65,536 bytes\. Please trim unnecessary debug comments/)
      ).toBeInTheDocument();
    });
  });

  /**
   * Requirement 4(d): Conceptual answer limit at 5,000 characters
   */
  describe('4(d) Conceptual answer character limit validation (5,000 characters)', () => {
    it('allows valid answers within the 5,000 character limit without warning', () => {
      const validText = 'A'.repeat(5000);
      render(<ConceptualAnswerEditor value={validText} maxLength={5000} />);

      expect(screen.getByText('5,000 / 5,000 chars')).toBeInTheDocument();
      expect(screen.queryByText(/Character limit exceeded/i)).not.toBeInTheDocument();
    });

    it('flags answers exceeding 5,000 characters and shows exact excess character warning', () => {
      const excessCount = 15;
      const overLimitText = 'A'.repeat(5000 + excessCount);
      render(<ConceptualAnswerEditor value={overLimitText} maxLength={5000} />);

      // Formatted character counter
      expect(screen.getByText('5,015 / 5,000 chars')).toBeInTheDocument();

      // Dynamic warning message indicating how many characters to shorten
      expect(
        screen.getByText(`Character limit exceeded! Please shorten by ${excessCount} characters.`)
      ).toBeInTheDocument();
    });
  });

  /**
   * Requirement 4(e): Route guard redirects an unauthenticated user to /login
   */
  describe('4(e) Route guard authentication protection and redirection', () => {
    it('redirects unauthenticated user to /login and blocks access to protected route', () => {
      // Unauthenticated state
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: null,
        isInitialising: false,
        token: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/technical']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/technical" element={<div data-testid="protected-content">Secret Technical Area</div>} />
            </Route>
            <Route path="/login" element={<div data-testid="login-page">Login Page Destination</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Verify protected content was NOT rendered
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

      // Verify redirect to /login occurred
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.getByText('Login Page Destination')).toBeInTheDocument();
    });

    it('allows access to protected route when user is authenticated', () => {
      // Authenticated state
      vi.mocked(authHook.useAuth).mockReturnValue({
        user: {
          id: 'usr-1',
          name: 'Priyanka Singh',
          email: 'priyanka@example.com',
          role: 'user',
          createdAt: new Date().toISOString(),
        },
        isInitialising: false,
        token: 'mock-valid-token',
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/technical']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/technical" element={<div data-testid="protected-content">Secret Technical Area</div>} />
            </Route>
            <Route path="/login" element={<div data-testid="login-page">Login Page Destination</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Verify protected content IS rendered
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Secret Technical Area')).toBeInTheDocument();

      // Verify user was NOT redirected to login
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });
  });
});
