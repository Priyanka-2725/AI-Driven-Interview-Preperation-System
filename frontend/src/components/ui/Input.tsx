import React, { InputHTMLAttributes, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, className = '', required, ...props }) => {
  const generatedId = useId();
  const id = props.id || generatedId;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <div className={`w-full ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-ink-900 mb-1">
        {label} {required && <span className="text-state-danger">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : hint ? descriptionId : undefined}
        className={`block w-full rounded-card border ${error ? 'border-state-danger focus:ring-state-danger' : 'border-surface-border focus:ring-brand-500 focus:border-brand-500'} bg-surface px-3 py-2 text-ink-900 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow disabled:bg-surface-muted disabled:text-ink-500`}
        {...props}
      />
      {hint && !error && (
        <p id={descriptionId} className="mt-1 text-sm text-ink-500">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-state-danger">{error}</p>
      )}
    </div>
  );
};
