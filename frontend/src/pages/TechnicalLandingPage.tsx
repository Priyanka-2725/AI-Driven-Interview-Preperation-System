import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Code2,
  BookOpen,
  Sparkles,
  History,
  Layers,
  Search,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { assessmentService } from '../services/assessmentService';
import { Question, Topic, Difficulty, QuestionType } from '../types/assessment.types';

const TOPICS: Array<{ value: Topic | ''; label: string }> = [
  { value: '', label: 'All Topics' },
  { value: 'arrays', label: 'Arrays & Two Pointers' },
  { value: 'trees', label: 'Trees & Binary Search' },
  { value: 'graphs', label: 'Graphs & BFS/DFS' },
  { value: 'strings', label: 'Strings & Parsing' },
  { value: 'databases', label: 'Databases & Indexing' },
  { value: 'python', label: 'Python Internals' },
  { value: 'javascript', label: 'JavaScript Runtime' },
  { value: 'system-design', label: 'System Design' },
];

const DIFFICULTIES: Array<{ value: Difficulty | ''; label: string }> = [
  { value: '', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const TYPES: Array<{ value: QuestionType | ''; label: string }> = [
  { value: '', label: 'All Formats' },
  { value: 'coding', label: 'Coding (Python)' },
  { value: 'conceptual', label: 'Conceptual (NLP)' },
];

export const TechnicalLandingPage: React.FC = () => {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedTopic, setSelectedTopic] = useState<Topic | ''>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | ''>('');
  const [selectedType, setSelectedType] = useState<QuestionType | ''>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Assessment Session Creation
  const [isCreatingAttempt, setIsCreatingAttempt] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assessmentService.getQuestions({
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        type: selectedType,
        limit: 50,
      });
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError('Could not load technical assessment questions. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, selectedDifficulty, selectedType]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleStartAttempt = async () => {
    try {
      setIsCreatingAttempt(true);
      setError(null);
      const attempt = await assessmentService.createAttempt({
        topic: (selectedTopic || 'arrays') as Topic,
        difficulty: (selectedDifficulty || 'medium') as Difficulty,
        questionCount: 3,
      });

      // Jump to first question in attempt
      if (attempt.questions && attempt.questions.length > 0) {
        const firstQ = attempt.questions[0];
        const qId = typeof firstQ === 'string' ? firstQ : firstQ.slug || firstQ.id || firstQ._id;
        navigate(`/technical/workspace/${qId}?attemptId=${attempt.id || attempt._id}`);
      } else {
        navigate(`/technical/attempts/${attempt.id || attempt._id}`);
      }
    } catch (err) {
      console.error('Error starting attempt session:', err);
      setError('Failed to initiate attempt session. Please try again.');
    } finally {
      setIsCreatingAttempt(false);
    }
  };

  const handleGenerateVariation = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const newQuestion = await assessmentService.generateQuestion({
        topic: (selectedTopic || 'arrays') as Topic,
        difficulty: (selectedDifficulty || 'medium') as Difficulty,
        type: (selectedType || 'coding') as QuestionType,
      });
      navigate(`/technical/workspace/${newQuestion.slug || newQuestion.id}`);
    } catch (err) {
      console.error('Failed to generate question variation:', err);
      setError('Unable to generate automated question variant right now.');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      q.title.toLowerCase().includes(term) ||
      (q.description && q.description.toLowerCase().includes(term)) ||
      q.slug.toLowerCase().includes(term)
    );
  });

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'hard':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1e1b4b] via-[#1e293b] to-[#0f172a] rounded-2xl p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Week 3 Technical Engine Live
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Technical Assessment Center</h1>
          <p className="text-slate-200 text-sm leading-relaxed">
            Practice algorithmic coding with Python in a secure sandbox or sharpen your engineering fundamentals with neural semantic conceptual scoring.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Link
            to="/technical/attempts"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 text-sm font-semibold transition border border-white/20"
          >
            <History className="w-4 h-4" />
            Past Attempts
          </Link>
          <button
            onClick={handleStartAttempt}
            disabled={isCreatingAttempt}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-md transition disabled:opacity-60"
          >
            {isCreatingAttempt ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <PlayCircle className="w-4 h-4 text-white" />
            )}
            Start 3-Question Session
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-surface-border p-4 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by title or keyword..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-surface-muted/50 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value as Topic | '')}
            className="text-xs font-medium px-3 py-2 bg-surface-muted border border-surface-border rounded-lg text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty | '')}
            className="text-xs font-medium px-3 py-2 bg-surface-muted border border-surface-border rounded-lg text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as QuestionType | '')}
            className="text-xs font-medium px-3 py-2 bg-surface-muted border border-surface-border rounded-lg text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {TYPES.map((tp) => (
              <option key={tp.value} value={tp.value}>
                {tp.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateVariation}
            disabled={isGenerating}
            title="Generate a dynamic question variation with automated test assertions"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200 transition disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Dynamic Variation'}
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchQuestions}
            className="text-xs font-semibold px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded-md text-rose-800 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Questions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 rounded-xl bg-surface-muted animate-pulse border border-surface-border" />
          ))}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-border p-12 text-center space-y-4">
          <Layers className="w-12 h-12 text-ink-300 mx-auto" />
          <h3 className="text-base font-semibold text-ink-900">No questions found matching your filter</h3>
          <p className="text-xs text-ink-500 max-w-sm mx-auto">
            Try adjusting your topic or difficulty filter, or generate a fresh dynamic question with the &quot;Dynamic Variation&quot; button.
          </p>
          <button
            onClick={() => {
              setSelectedTopic('');
              setSelectedDifficulty('');
              setSelectedType('');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-4 py-2 rounded-lg transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestions.map((q) => (
            <div
              key={q.id || q.slug}
              className="bg-white rounded-xl border border-surface-border hover:border-brand-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {q.type === 'coding' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Code2 className="w-3 h-3" />
                        Coding
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        <BookOpen className="w-3 h-3" />
                        Conceptual
                      </span>
                    )}
                    <span className="text-xs font-medium text-ink-500 capitalize">
                      {q.topic.replace('-', ' ')}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${getDifficultyBadge(
                      q.difficulty
                    )}`}
                  >
                    {q.difficulty}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-ink-900 text-base group-hover:text-brand-600 transition">
                    {q.title}
                  </h3>
                  <p className="text-xs text-ink-500 line-clamp-3 mt-1 leading-relaxed">
                    {q.description || q.questionText || 'Interactive technical problem statement.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-surface-border flex items-center justify-between">
                <div className="text-xs text-ink-400">
                  {q.type === 'coding' ? (
                    <span>{q.testCases?.length || 2} visible test cases</span>
                  ) : (
                    <span>Semantic NLP evaluation</span>
                  )}
                </div>

                <Link
                  to={`/technical/workspace/${q.slug || q.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 group-hover:translate-x-0.5 transition-transform"
                >
                  Solve Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
