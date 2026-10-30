import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  Cpu,
  FileCode,
  Tag,
  AlertCircle
} from 'lucide-react';
import { assessmentService } from '../services/assessmentService';
import { Submission, CodingEvaluation, ConceptualEvaluation, CodingTestResult } from '../types/assessment.types';
import { AssessmentErrorBanner } from '../components/assessment/AssessmentErrorBanner';

export const TechnicalResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const fetchSubmission = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const sub = await assessmentService.getSubmissionById(id);
      setSubmission(sub);
    } catch (err: unknown) {
      console.error('Failed to load submission results:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Could not load submission report.');
      } else {
        setError('Submission results could not be found.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleRetry = async () => {
    if (!submission) return;
    try {
      setIsRetrying(true);
      const subId = submission.id || submission._id || id!;
      const retried = await assessmentService.retrySubmission(subId);
      setSubmission(retried);
    } catch (err) {
      console.error('Retry submission error:', err);
      alert('Retry failed. ML Service may still be unavailable.');
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <span className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
        <p className="text-sm text-ink-500 font-medium">Aggregating evaluation telemetry...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-surface-border p-8 text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-ink-900">Evaluation Report Not Found</h2>
        <p className="text-sm text-ink-500">{error || 'Unable to retrieve evaluation results.'}</p>
        <Link
          to="/technical"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition"
        >
          Return to Technical Hub
        </Link>
      </div>
    );
  }

  const isFailed = submission.status === 'failed';
  const score = submission.score ?? 0;
  const isCoding = submission.type === 'coding';
  const codingEval = isCoding ? (submission.evaluation as CodingEvaluation) : null;
  const conceptualEval = !isCoding ? (submission.evaluation as ConceptualEvaluation) : null;

  const testResults = codingEval?.testResults || codingEval?.results || [];
  const passedTestsCount = codingEval?.passedTests ?? testResults.filter((t: CodingTestResult) => t.passed).length;
  const totalTestsCount = codingEval?.totalTests ?? testResults.length;

  const getScoreColor = (sc: number) => {
    if (sc >= 85) return 'text-emerald-600 border-emerald-500 bg-emerald-50';
    if (sc >= 60) return 'text-amber-600 border-amber-500 bg-amber-50';
    return 'text-rose-600 border-rose-500 bg-rose-50';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Banner Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-surface-border shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink-900">Technical Evaluation Report</h1>
            <p className="text-xs text-ink-500">
              Submission ID: <span className="font-mono">{submission.id || submission._id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {attemptId ? (
            <Link
              to={`/technical/attempts/${attemptId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition border border-brand-200"
            >
              View Attempt Session
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/technical"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-ink-700 bg-surface-muted hover:bg-surface-border transition border border-surface-border"
            >
              Browse Questions
            </Link>
          )}
        </div>
      </div>

      {/* Failed Submission State / Retry Banner */}
      {isFailed && (
        <AssessmentErrorBanner
          error={{
            statusCode: 503,
            code: 'ML_SERVICE_UNAVAILABLE',
            submissionId: submission.id || submission._id,
            message:
              submission.errorDetails?.message ||
              'Evaluation failed because the ML engine was offline or timed out.',
          }}
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      )}

      {/* Score Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Overall Score Circle Card */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-surface-border p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Overall Score
          </span>

          <div
            className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all ${getScoreColor(
              score
            )}`}
          >
            <span className="text-4xl font-extrabold">{score}</span>
            <span className="text-xs font-medium text-ink-500">out of 100</span>
          </div>

          <div className="text-xs font-medium text-ink-600">
            {score >= 85
              ? 'Outstanding performance demonstrating strong mastery.'
              : score >= 60
              ? 'Solid submission meeting core functional requirements.'
              : 'Requires improvement on correctness or key concept coverage.'}
          </div>
        </div>

        {/* Telemetry Breakdown Cards */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-surface-border p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-ink-900 mb-1">Score Breakdown</h3>
            <p className="text-xs text-ink-500">
              Standardized weighted evaluation metrics according to technical grading criteria.
            </p>
          </div>

          {isCoding ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-surface-muted border border-surface-border space-y-1">
                <div className="text-xs text-ink-500 font-medium">Test Pass Ratio</div>
                <div className="text-2xl font-bold text-ink-900">
                  {passedTestsCount} / {totalTestsCount}
                </div>
                <div className="text-xs text-emerald-600 font-semibold">
                  {totalTestsCount > 0
                    ? `${Math.round((passedTestsCount / totalTestsCount) * 100)}% Passed`
                    : '—'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-muted border border-surface-border space-y-1">
                <div className="text-xs text-ink-500 font-medium">Test Pass Weight</div>
                <div className="text-2xl font-bold text-ink-900">
                  {submission.scoreBreakdown?.testPassWeight?.toFixed(1) ??
                    (passedTestsCount === totalTestsCount ? '80.0' : '0.0')}{' '}
                  <span className="text-xs font-normal text-ink-400">/ 80</span>
                </div>
                <div className="text-xs text-ink-400">Correctness weight</div>
              </div>

              <div className="p-4 rounded-xl bg-surface-muted border border-surface-border space-y-1">
                <div className="text-xs text-ink-500 font-medium">Runtime Efficiency</div>
                <div className="text-2xl font-bold text-ink-900">
                  {submission.scoreBreakdown?.runtimeEfficiency?.toFixed(1) ?? '20.0'}{' '}
                  <span className="text-xs font-normal text-ink-400">/ 20</span>
                </div>
                <div className="text-xs text-ink-400">
                  Avg: {codingEval?.avgRuntimeMs?.toFixed(1) ?? '—'} ms
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-surface-muted border border-surface-border space-y-1">
                <div className="text-xs text-ink-500 font-medium">Semantic Similarity</div>
                <div className="text-2xl font-bold text-indigo-700">
                  {conceptualEval?.semanticSimilarity?.toFixed(1) ?? '—'}%
                </div>
                <div className="text-xs text-ink-400">Sentence-BERT alignment</div>
              </div>

              <div className="p-4 rounded-xl bg-surface-muted border border-surface-border space-y-1">
                <div className="text-xs text-ink-500 font-medium">Concept Coverage</div>
                <div className="text-2xl font-bold text-purple-700">
                  {conceptualEval?.conceptCoverage?.toFixed(1) ?? '—'}%
                </div>
                <div className="text-xs text-ink-400">Keyword & entity recall</div>
              </div>

              <div className="p-4 rounded-xl bg-surface-muted border border-surface-border space-y-1">
                <div className="text-xs text-ink-500 font-medium">Engine & Depth</div>
                <div className="text-xl font-bold text-ink-900 capitalize flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-brand-600" />
                  {conceptualEval?.engine || 'Neural'}
                </div>
                <div className="text-xs text-ink-400">{conceptualEval?.wordCount ?? 0} words analyzed</div>
              </div>
            </div>
          )}

          {/* Feedback summary */}
          <div className="p-4 rounded-xl bg-brand-50/70 border border-brand-200 text-brand-900 text-xs leading-relaxed space-y-1">
            <div className="font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Automated Feedback
            </div>
            <p>{submission.feedback || 'Evaluation completed successfully.'}</p>
          </div>
        </div>
      </div>

      {/* Conceptual Concepts Badges */}
      {!isCoding && conceptualEval && (
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-ink-900">Concept Verification Breakdown</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Concepts */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Matched Core Concepts ({conceptualEval.matchedConcepts?.length || 0})
              </div>
              <div className="flex flex-wrap gap-2">
                {conceptualEval.matchedConcepts && conceptualEval.matchedConcepts.length > 0 ? (
                  conceptualEval.matchedConcepts.map((concept: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-emerald-600" />
                      {concept}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-ink-400 italic">No key concepts matched</span>
                )}
              </div>
            </div>

            {/* Missing Concepts */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                Missing Core Concepts ({conceptualEval.missingConcepts?.length || 0})
              </div>
              <div className="flex flex-wrap gap-2">
                {conceptualEval.missingConcepts && conceptualEval.missingConcepts.length > 0 ? (
                  conceptualEval.missingConcepts.map((concept: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-rose-600" />
                      {concept}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-700 font-medium">
                    All expected core concepts covered!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coding Per-Test Execution Table (Condition 4: Hidden test cases labeled "Hidden test passed/failed" only) */}
      {isCoding && testResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-border overflow-hidden shadow-sm space-y-4 p-6">
          <div>
            <h3 className="text-sm font-bold text-ink-900">Per-Test Case Execution Results</h3>
            <p className="text-xs text-ink-500">
              Visible tests show verified inputs and outputs. Hidden tests are verified securely without disclosing edge-case payloads.
            </p>
          </div>

          <div className="divide-y divide-surface-border border border-surface-border rounded-xl overflow-hidden text-xs">
            {testResults.map((tc: CodingTestResult, idx: number) => {
              const isHidden = Boolean(tc.isHidden);
              return (
                <div key={tc.testIndex ?? idx} className="p-4 space-y-2 hover:bg-surface-muted/30 transition">
                  <div className="flex items-center justify-between font-sans">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold ${
                          tc.passed
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {tc.passed ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            {isHidden ? 'Hidden test passed' : 'Passed'}
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            {isHidden ? 'Hidden test failed' : 'Failed'}
                          </>
                        )}
                      </span>

                      <span className="font-mono text-ink-500 font-medium">
                        Test #{idx + 1} {isHidden ? '(Hidden Suite)' : '(Visible Sample)'}
                      </span>
                    </div>

                    {tc.runtimeMs !== undefined && (
                      <span className="text-ink-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {tc.runtimeMs.toFixed(1)} ms
                      </span>
                    )}
                  </div>

                  {/* Render payload only for visible tests */}
                  {!isHidden ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-mono">
                      <div>
                        <span className="text-ink-400 font-sans">Input:</span>
                        <pre className="mt-1 p-2 rounded bg-surface-muted text-ink-900 whitespace-pre-wrap">
                          {tc.input || '(empty)'}
                        </pre>
                      </div>
                      <div>
                        <span className="text-ink-400 font-sans">Expected Output:</span>
                        <pre className="mt-1 p-2 rounded bg-surface-muted text-ink-900 whitespace-pre-wrap">
                          {tc.expectedOutput ?? tc.expected ?? '(empty)'}
                        </pre>
                      </div>
                      {tc.actualOutput !== undefined && (
                        <div className="md:col-span-2">
                          <span className="text-ink-400 font-sans">Actual Output:</span>
                          <pre
                            className={`mt-1 p-2 rounded whitespace-pre-wrap ${
                              tc.passed
                                ? 'bg-emerald-50/50 text-emerald-900 border border-emerald-200'
                                : 'bg-rose-50/50 text-rose-900 border border-rose-200'
                            }`}
                          >
                            {tc.actualOutput ?? tc.actual ?? '(empty)'}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-ink-400 italic pt-1">
                      Input and output redacted for hidden evaluation security.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Candidate Submitted Content (Read-Only) */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-ink-600" />
            <h3 className="text-sm font-bold text-ink-900">Your Submitted Answer</h3>
          </div>
          <span className="text-xs text-ink-400 font-mono">
            {new Date(submission.createdAt).toLocaleString()}
          </span>
        </div>

        {isCoding ? (
          <div className="rounded-xl overflow-hidden border border-slate-700 bg-[#1e1e1e] p-4 text-slate-200 font-mono text-xs overflow-x-auto whitespace-pre">
            <code>{submission.code || '# No code submitted'}</code>
          </div>
        ) : (
          <div className="rounded-xl border border-surface-border bg-surface-muted/50 p-4 text-ink-900 text-sm whitespace-pre-wrap leading-relaxed font-sans">
            {submission.answerText || 'No explanation provided.'}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-4">
        <Link
          to="/technical"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-ink-700 bg-white border border-surface-border hover:bg-surface-muted shadow-sm transition"
        >
          <Layers className="w-4 h-4" />
          Technical Question Hub
        </Link>

        {attemptId && (
          <button
            onClick={() => navigate(`/technical/attempts/${attemptId}`)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md transition"
          >
            Continue Assessment Session
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
