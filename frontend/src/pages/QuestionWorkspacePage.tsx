import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Code2,
  BookOpen,
  ArrowLeft,
  Play,
  Send,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { assessmentService } from '../services/assessmentService';
import { Question, CodingTestResult, QuestionTestCase } from '../types/assessment.types';
import { CodeEditor } from '../components/assessment/CodeEditor';
import { ConceptualAnswerEditor } from '../components/assessment/ConceptualAnswerEditor';
import { VisibleTestPanel } from '../components/assessment/VisibleTestPanel';
import {
  AssessmentErrorBanner,
  AssessmentErrorState,
} from '../components/assessment/AssessmentErrorBanner';

export const QuestionWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [code, setCode] = useState<string>('');
  const [conceptualAnswer, setConceptualAnswer] = useState<string>('');

  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<CodingTestResult[]>([]);
  const [errorState, setErrorState] = useState<AssessmentErrorState | null>(null);

  const loadQuestion = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorState(null);
      const q = await assessmentService.getQuestionById(id);
      setQuestion(q);

      // Initialize starter code or default template
      if (q.type === 'coding') {
        const initialCode =
          q.starterCode?.python ||
          `import sys\n\ndef solve():\n    # Read input from standard input\n    input_data = sys.stdin.read().split()\n    if not input_data:\n        return\n    # Implement solution here\n    pass\n\nif __name__ == '__main__':\n    solve()\n`;
        setCode(initialCode);

        // Prepopulate visible test templates
        if (q.testCases && q.testCases.length > 0) {
          const visible = q.testCases
            .filter((tc: QuestionTestCase) => !tc.isHidden)
            .map((tc: QuestionTestCase, idx: number) => ({
              testIndex: idx,
              passed: false,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              actualOutput: '(not run yet)',
              isHidden: false,
            }));
          setTestResults(visible);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load question workspace:', err);
      if (axios.isAxiosError(err)) {
        const code = err.response?.data?.error?.code;
        setErrorState({
          statusCode: err.response?.status,
          code,
          message: err.response?.data?.error?.message || 'Question could not be found.',
        });
      } else {
        setErrorState({
          message: 'Failed to load question details. Please return to the question catalog.',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleRunCode = async () => {
    if (!question || isRunning) return;
    try {
      setIsRunning(true);
      setErrorState(null);
      const res = await assessmentService.runCode({
        questionId: question.id || question._id || question.slug,
        code,
        language: 'python',
      });
      setTestResults(res.testResults || []);
    } catch (err: unknown) {
      console.error('Run code error:', err);
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data?.error;
        setErrorState({
          statusCode: err.response?.status,
          code: errorData?.code,
          message: errorData?.message || 'Error running test execution',
        });
      } else {
        setErrorState({ message: 'Execution request failed.' });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!question || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setErrorState(null);

      const targetQuestionId = question.id || question._id || question.slug;

      const sub = await assessmentService.submitAnswer({
        questionId: targetQuestionId,
        attemptId: attemptId || null,
        type: question.type,
        code: question.type === 'coding' ? code : undefined,
        language: 'python',
        answerText: question.type === 'conceptual' ? conceptualAnswer : undefined,
      });

      const submissionId = sub.id || sub._id;
      const attemptQuery = attemptId ? `?attemptId=${attemptId}` : '';
      navigate(`/technical/results/${submissionId}${attemptQuery}`);
    } catch (err: unknown) {
      console.error('Submission error:', err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const errObj = err.response?.data?.error;
        const submissionId = errObj?.details?.submissionId || err.response?.data?.data?.submissionId;

        setErrorState({
          statusCode: status,
          code: errObj?.code,
          message: errObj?.message || 'Failed to submit answer for evaluation.',
          submissionId,
        });
      } else {
        setErrorState({
          message: 'An unexpected error occurred during submission.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetrySubmission = async (submissionId: string) => {
    try {
      setIsRetrying(true);
      const retried = await assessmentService.retrySubmission(submissionId);
      const attemptQuery = attemptId ? `?attemptId=${attemptId}` : '';
      navigate(`/technical/results/${retried.id || retried._id}${attemptQuery}`);
    } catch (err: unknown) {
      console.error('Retry failed:', err);
      if (axios.isAxiosError(err)) {
        setErrorState({
          statusCode: err.response?.status,
          code: err.response?.data?.error?.code,
          message: err.response?.data?.error?.message || 'Retry attempt failed. ML service may still be unreachable.',
          submissionId,
        });
      }
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <span className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
        <p className="text-sm text-ink-500 font-medium">Preparing workspace environment...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-surface-border p-8 text-center space-y-4 shadow-sm">
        <AssessmentErrorBanner error={errorState} />
        <h2 className="text-xl font-bold text-ink-900">Question Unavailable</h2>
        <p className="text-sm text-ink-500">
          The requested question could not be found or has been moved.
        </p>
        <Link
          to="/technical"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Question Catalog
        </Link>
      </div>
    );
  }

  const isCoding = question.type === 'coding';

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-12">
      {/* Top Breadcrumb & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-5 py-3 rounded-xl border border-surface-border shadow-sm">
        <div className="flex items-center space-x-3">
          <Link
            to={attemptId ? `/technical/attempts/${attemptId}` : '/technical'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-ink-900 bg-surface-muted px-2.5 py-1.5 rounded-lg border border-surface-border transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {attemptId ? 'Back to Attempt' : 'Question Bank'}
          </Link>
          <div className="h-4 w-px bg-surface-border" />
          <h1 className="text-sm font-bold text-ink-900 line-clamp-1">{question.title}</h1>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize bg-surface-muted text-ink-700 border border-surface-border">
            {question.topic.replace('-', ' ')}
          </span>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize border ${
              question.difficulty === 'easy'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : question.difficulty === 'medium'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {question.difficulty}
          </span>
          {isCoding && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-500 font-mono">
              <Clock className="w-3.5 h-3.5" />
              {question.timeLimitSeconds || 3}s limit
            </span>
          )}
        </div>
      </div>

      {/* Error / Rate Limit / ML-Down Banner */}
      <AssessmentErrorBanner
        error={errorState}
        onRetry={handleRetrySubmission}
        isRetrying={isRetrying}
        onDismiss={() => setErrorState(null)}
      />

      {/* Dual Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Pane: Question Statement & Reference Rules */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-surface-border shadow-sm p-6 space-y-6 max-h-[820px] overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isCoding ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                  <Code2 className="w-3.5 h-3.5" />
                  Algorithm Challenge
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700">
                  <BookOpen className="w-3.5 h-3.5" />
                  Conceptual Explanation
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-ink-900">{question.title}</h2>
          </div>

          <div className="prose prose-sm text-ink-700 leading-relaxed max-w-none whitespace-pre-wrap font-sans">
            {question.description || question.questionText}
          </div>

          {/* Key Topics / Concepts Guidance */}
          {question.keyConcepts && question.keyConcepts.length > 0 && (
            <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-xl space-y-2">
              <div className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Key Focus Areas
              </div>
              <p className="text-xs text-purple-700">
                To maximize your semantic score, address the underlying mechanisms, efficiency factors, and core terminology:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {question.keyConcepts.map((kc: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-0.5 rounded-md bg-white border border-purple-200 text-purple-800 font-medium"
                  >
                    {kc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Visible Test Cases Preview (for Coding) */}
          {isCoding && question.testCases && question.testCases.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Visible Test Cases ({question.testCases.filter((t: QuestionTestCase) => !t.isHidden).length})
              </h3>
              <div className="space-y-3">
                {question.testCases
                  .filter((tc: QuestionTestCase) => !tc.isHidden)
                  .map((tc: QuestionTestCase, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-surface-muted rounded-lg border border-surface-border text-xs font-mono space-y-2"
                    >
                      <div className="font-semibold text-ink-700 font-sans">Example {idx + 1}:</div>
                      <div>
                        <span className="text-ink-400 font-sans">Input:</span>
                        <pre className="mt-1 p-2 bg-white rounded border border-surface-border whitespace-pre-wrap text-ink-900">
                          {tc.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-ink-400 font-sans">Expected Output:</span>
                        <pre className="mt-1 p-2 bg-white rounded border border-surface-border whitespace-pre-wrap text-ink-900">
                          {tc.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-ink-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              {isCoding
                ? 'Your code will be evaluated using stdin/stdout against visible and hidden test cases in an isolated execution sandbox.'
                : 'Your explanation will be graded using Sentence-BERT semantic similarity and concept coverage against standard reference guidelines.'}
            </span>
          </div>
        </div>

        {/* Right Pane: Interactive Editor & Actions */}
        <div className="lg:col-span-7 space-y-4">
          {isCoding ? (
            <div className="space-y-4">
              <CodeEditor
                value={code}
                onChange={setCode}
                language="python"
                height="460px"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-surface-border shadow-sm">
                <button
                  onClick={() => {
                    if (
                      window.confirm('Reset code to starter template? Your current edits will be cleared.')
                    ) {
                      setCode(question.starterCode?.python || '');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-800 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Starter Code
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning || isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-ink-700 bg-surface-muted hover:bg-slate-200/80 border border-surface-border transition disabled:opacity-50"
                  >
                    {isRunning ? (
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-ink-700" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-ink-700" />
                    )}
                    Run Visible Tests
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={isRunning || isSubmitting || !code.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Submit Solution
                  </button>
                </div>
              </div>

              {/* Visible Tests Panel */}
              <VisibleTestPanel
                testResults={testResults}
                isRunning={isRunning}
                onRun={handleRunCode}
                canRun={!isRunning && !isSubmitting}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <ConceptualAnswerEditor
                value={conceptualAnswer}
                onChange={setConceptualAnswer}
                maxLength={5000}
              />

              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-surface-border shadow-sm">
                <span className="text-xs text-ink-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Your answer will be saved and graded securely.
                </span>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !conceptualAnswer.trim() || conceptualAnswer.length > 5000}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Submit Conceptual Answer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
