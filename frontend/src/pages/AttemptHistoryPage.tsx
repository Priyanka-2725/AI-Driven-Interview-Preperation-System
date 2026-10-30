import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  History,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  ArrowLeft,
  BookOpen,
  Code2,
  AlertCircle
} from 'lucide-react';
import { assessmentService } from '../services/assessmentService';
import { Attempt, Question, Submission } from '../types/assessment.types';

export const AttemptHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // List view state
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(!id);

  // Detail view state
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const loadAttemptsList = useCallback(async () => {
    try {
      setLoadingList(true);
      setError(null);
      const res = await assessmentService.getUserAttempts({ limit: 50 });
      setAttempts(res.attempts || []);
    } catch (err) {
      console.error('Failed to load user attempts:', err);
      setError('Unable to load attempt history.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadAttemptDetail = useCallback(async (attemptId: string) => {
    try {
      setLoadingDetail(true);
      setError(null);
      const att = await assessmentService.getAttemptById(attemptId);
      setCurrentAttempt(att);
    } catch (err: unknown) {
      console.error('Failed to load attempt detail:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Attempt session not found.');
      } else {
        setError('Failed to load attempt session details.');
      }
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadAttemptDetail(id);
    } else {
      loadAttemptsList();
    }
  }, [id, loadAttemptDetail, loadAttemptsList]);

  // Detail View Rendering
  if (id) {
    if (loadingDetail) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <span className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
          <p className="text-sm text-ink-500 font-medium">Loading assessment session details...</p>
        </div>
      );
    }

    if (error || !currentAttempt) {
      return (
        <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-surface-border p-8 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-ink-900">Attempt Session Not Found</h2>
          <p className="text-sm text-ink-500">{error || 'This session does not exist or belongs to another user.'}</p>
          <Link
            to="/technical/attempts"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Attempt History
          </Link>
        </div>
      );
    }

    const isCompleted = currentAttempt.status === 'completed';
    const questionsList = (currentAttempt.questions || []) as Array<Question | string>;
    const submissionsList = currentAttempt.submissions || [];

    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-16">
        {/* Header Breadcrumbs */}
        <div className="flex items-center justify-between">
          <Link
            to="/technical/attempts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-ink-900 bg-white px-3 py-1.5 rounded-lg border border-surface-border shadow-sm transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Past Attempts
          </Link>

          <Link
            to="/technical"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
          >
            + Start New Assessment
          </Link>
        </div>

        {/* Attempt Session Summary Card */}
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                  isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {isCompleted ? '✓ Completed' : 'In Progress'}
              </span>
              <span className="text-xs font-medium text-ink-500 capitalize">
                Topic: {currentAttempt.topic.replace('-', ' ')}
              </span>
              <span className="text-xs text-ink-400">•</span>
              <span className="text-xs font-medium text-ink-500 capitalize">
                Difficulty: {currentAttempt.difficulty}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-ink-900">{currentAttempt.title}</h1>
            <div className="text-xs text-ink-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Started on {new Date(currentAttempt.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end justify-center border-t md:border-t-0 md:border-l border-surface-border pt-4 md:pt-0 md:pl-8">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">
              Composite Score
            </span>
            <div className="text-4xl font-black text-brand-600 mt-1">
              {currentAttempt.compositeScore !== undefined && currentAttempt.compositeScore !== null
                ? currentAttempt.compositeScore
                : '—'}
              <span className="text-xs font-medium text-ink-400 ml-1">/ 100</span>
            </div>
            <span className="text-xs text-ink-500 mt-1">
              {submissionsList.length} of {questionsList.length} answered
            </span>
          </div>
        </div>

        {/* Questions Checklist */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            Session Questions ({questionsList.length})
          </h2>

          <div className="space-y-4">
            {questionsList.map((qItem, idx) => {
              const isObj = typeof qItem === 'object' && qItem !== null;
              const qTitle = isObj ? qItem.title : `Question ${idx + 1}`;
              const qSlug = isObj ? qItem.slug || qItem.id : (qItem as string);
              const qType = isObj ? qItem.type : 'coding';
              const qDifficulty = isObj ? qItem.difficulty : currentAttempt.difficulty;

              // Check if candidate has submitted for this question
              const matchedSub = submissionsList.find(
                (s: Submission) =>
                  s.questionId === qSlug ||
                  (typeof s.questionId === 'object' && s.questionId && (s.questionId as Question).id === qSlug)
              );

              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-surface-border p-5 shadow-sm hover:border-brand-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="mt-1">
                      {matchedSub ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-ink-300" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink-400">#{idx + 1}</span>
                        <h3 className="text-sm font-bold text-ink-900">{qTitle}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-muted border border-surface-border capitalize text-ink-600">
                          {qDifficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-500">
                        <span className="inline-flex items-center gap-1">
                          {qType === 'coding' ? <Code2 className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                          {qType === 'coding' ? 'Python Sandbox' : 'Conceptual NLP'}
                        </span>
                        {matchedSub && (
                          <span className="font-semibold text-emerald-700">
                            Score: {matchedSub.score ?? '—'} / 100
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {matchedSub ? (
                      <Link
                        to={`/technical/results/${matchedSub.id || matchedSub._id}?attemptId=${currentAttempt.id || currentAttempt._id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition"
                      >
                        Review Score
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        to={`/technical/workspace/${qSlug}?attemptId=${currentAttempt.id || currentAttempt._id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition"
                      >
                        Solve Now
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // List View Rendering
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Technical Assessment History</h1>
          <p className="text-xs text-ink-500 mt-1">
            Review your past multi-question technical sessions, scores, and grading reports.
          </p>
        </div>

        <Link
          to="/technical"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition self-start sm:self-auto"
        >
          <Layers className="w-4 h-4" />
          Start New Assessment
        </Link>
      </div>

      {/* Error state if any */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between text-sm">
          <span>{error}</span>
          <button
            onClick={loadAttemptsList}
            className="text-xs font-semibold px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded-md transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Attempts Grid / Cards */}
      {loadingList ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-xl bg-surface-muted animate-pulse border border-surface-border" />
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-border p-12 text-center space-y-4 shadow-sm">
          <History className="w-12 h-12 text-ink-300 mx-auto" />
          <h3 className="text-base font-semibold text-ink-900">No Assessment Sessions Yet</h3>
          <p className="text-xs text-ink-500 max-w-md mx-auto">
            You haven&apos;t started any technical assessment sessions yet. Take a 3-question timed assessment to test your algorithmic and conceptual mastery.
          </p>
          <Link
            to="/technical"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-md transition"
          >
            Go to Assessment Hub
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((att) => {
            const isCompleted = att.status === 'completed';
            const attId = att.id || att._id;
            return (
              <div
                key={attId}
                onClick={() => navigate(`/technical/attempts/${attId}`)}
                className="bg-white rounded-xl border border-surface-border hover:border-brand-300 p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {isCompleted ? '✓ Completed' : 'In Progress'}
                    </span>
                    <span className="text-xs font-medium text-ink-500 capitalize">
                      {att.topic.replace('-', ' ')}
                    </span>
                    <span className="text-xs text-ink-400">•</span>
                    <span className="text-xs font-medium text-ink-500 capitalize">
                      {att.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-ink-900">{att.title}</h3>

                  <div className="text-xs text-ink-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(att.createdAt).toLocaleDateString()} at{' '}
                    {new Date(att.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-surface-border">
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-400 block">
                      Score
                    </span>
                    <span className="text-2xl font-black text-brand-600">
                      {att.compositeScore !== undefined && att.compositeScore !== null
                        ? att.compositeScore
                        : '—'}
                      <span className="text-xs font-medium text-ink-400 ml-0.5">/ 100</span>
                    </span>
                  </div>

                  <Link
                    to={`/technical/attempts/${attId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
