import React from 'react';

interface ConceptualAnswerEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  maxLength?: number;
}

export const ConceptualAnswerEditor: React.FC<ConceptualAnswerEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  maxLength = 5000,
}) => {
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const isNearLimit = charCount > maxLength * 0.9;
  const isOverLimit = charCount > maxLength;

  return (
    <div className="flex flex-col space-y-3 bg-white border border-surface-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">Your Conceptual Explanation</h3>
          <p className="text-xs text-ink-500">
            Explain the concept clearly, covering fundamental principles, mechanisms, and trade-offs.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-surface-muted text-ink-700 font-medium border border-surface-border">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          <span
            className={`px-2.5 py-1 rounded-md font-mono font-medium border ${
              isOverLimit
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isNearLimit
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-surface-muted text-ink-700 border-surface-border'
            }`}
          >
            {charCount.toLocaleString()} / {maxLength.toLocaleString()} chars
          </span>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={readOnly}
        placeholder="Structure your answer clearly. For example: define the concept, explain how it operates internally, provide key advantages/disadvantages, and discuss practical real-world use cases..."
        rows={14}
        className={`w-full p-4 text-sm font-sans text-ink-900 bg-surface-muted/40 rounded-lg border focus:ring-2 focus:outline-none transition-all resize-y ${
          isOverLimit
            ? 'border-rose-400 focus:ring-rose-500/20'
            : 'border-surface-border focus:border-brand-500 focus:ring-brand-500/20'
        } ${readOnly ? 'bg-slate-50 cursor-not-allowed opacity-90' : ''}`}
      />

      <div className="flex items-center justify-between text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tip: Conceptual answers are evaluated using neural semantic similarity and domain concept coverage.
        </span>
        {isOverLimit && (
          <span className="text-rose-600 font-semibold">
            Character limit exceeded! Please shorten by {charCount - maxLength} characters.
          </span>
        )}
      </div>
    </div>
  );
};
