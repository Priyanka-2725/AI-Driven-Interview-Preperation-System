import React from 'react';
import { AlertTriangle, Clock, RefreshCw, XCircle, ShieldAlert } from 'lucide-react';

export interface AssessmentErrorState {
  code?: string;
  message?: string;
  submissionId?: string;
  statusCode?: number;
}

interface AssessmentErrorBannerProps {
  error: AssessmentErrorState | null;
  onRetry?: (submissionId: string) => void;
  isRetrying?: boolean;
  onDismiss?: () => void;
}

export const AssessmentErrorBanner: React.FC<AssessmentErrorBannerProps> = ({
  error,
  onRetry,
  isRetrying = false,
  onDismiss,
}) => {
  if (!error) return null;

  const code = error.code || '';
  const isRateLimit =
    code === 'RATE_LIMIT_EXCEEDED' ||
    code === 'SUBMISSION_RATE_LIMIT_EXCEEDED' ||
    code === 'RUN_RATE_LIMIT_EXCEEDED' ||
    error.statusCode === 429;

  const isCodeTooLarge = code === 'CODE_TOO_LARGE' || error.statusCode === 413;
  const isAnswerTooLong = code === 'ANSWER_TOO_LONG';
  const isMlUnavailable =
    code === 'ML_SERVICE_UNAVAILABLE' ||
    code === 'NLP_EVALUATION_FAILED' ||
    error.statusCode === 503 ||
    error.statusCode === 502;

  const isTimeout = code === 'EXECUTION_TIMEOUT';
  const isSecurity = code === 'CODE_EXECUTION_BLOCKED';

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isMlUnavailable
          ? 'bg-amber-50/90 border-amber-300 text-amber-900'
          : isRateLimit
          ? 'bg-orange-50/90 border-orange-300 text-orange-900'
          : 'bg-rose-50/90 border-rose-300 text-rose-900'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="mt-0.5 flex-shrink-0">
          {isRateLimit ? (
            <Clock className="w-5 h-5 text-orange-600" />
          ) : isMlUnavailable ? (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          ) : isSecurity ? (
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600" />
          )}
        </div>
        <div className="space-y-1">
          <div className="font-semibold text-sm">
            {isRateLimit && 'Rate Limit Exceeded'}
            {isCodeTooLarge && 'Payload Too Large (64 KB Limit)'}
            {isAnswerTooLong && 'Answer Exceeds Limit (5,000 Chars)'}
            {isMlUnavailable && 'ML Service Temporarily Unavailable'}
            {isTimeout && 'Execution Time Limit Exceeded'}
            {isSecurity && 'Restricted Execution Blocked'}
            {!isRateLimit && !isCodeTooLarge && !isAnswerTooLong && !isMlUnavailable && !isTimeout && !isSecurity && 'Evaluation Error'}
          </div>
          <p className="text-xs opacity-90">
            {isRateLimit
              ? 'You have reached the temporary rate limit (10 submits/min, 20 runs/min). Please wait a moment before trying again.'
              : isCodeTooLarge
              ? 'Your submitted code exceeds 65,536 bytes. Please trim unnecessary debug comments or large embedded constants.'
              : isAnswerTooLong
              ? 'Your explanation exceeds the 5,000 character maximum. Please condense your explanation.'
              : isMlUnavailable
              ? error.submissionId
                ? 'The AI evaluation service is currently unreachable or timed out. Your submission was saved as "failed" and can be retried.'
                : 'The AI evaluation service is temporarily unavailable. Please try again shortly.'
              : isTimeout
              ? 'Your solution exceeded the 3.0-second execution limit. Check for infinite loops or non-optimal algorithms.'
              : isSecurity
              ? 'Security violation: Import of restricted system libraries (e.g., os, subprocess, socket) is blocked in sandbox.'
              : error.message || 'An unexpected error occurred during submission evaluation.'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 self-end md:self-center flex-shrink-0">
        {isMlUnavailable && error.submissionId && onRetry && (
          <button
            onClick={() => onRetry(error.submissionId!)}
            disabled={isRetrying}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry Evaluation'}
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-md hover:bg-black/5 text-ink-500 hover:text-ink-800 transition"
            title="Dismiss error"
          >
            <span className="sr-only">Dismiss</span>
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
