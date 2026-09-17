import React, { ReactNode } from 'react';

interface AlertProps {
  tone?: 'success' | 'warn' | 'danger' | 'info';
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ tone = 'info', title, children, onDismiss }) => {
  const tones = {
    success: 'bg-state-success/10 border-state-success text-state-success',
    warn: 'bg-state-warn/10 border-state-warn text-state-warn',
    danger: 'bg-state-danger/10 border-state-danger text-state-danger',
    info: 'bg-state-info/10 border-state-info text-state-info',
  };

  const isAlert = tone === 'danger' || tone === 'warn';

  return (
    <div
      role={isAlert ? 'alert' : 'status'}
      className={`relative rounded-card border p-4 ${tones[tone]}`}
    >
      <div className="flex">
        <div className="flex-1 md:flex md:justify-between">
          <div>
            {title && <h3 className="text-sm font-medium">{title}</h3>}
            <div className={`text-sm ${title ? 'mt-2' : ''}`}>
              {children}
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 focus:ring-2 focus:ring-offset-2 hover:opacity-75`}
          >
            <span className="sr-only">Dismiss</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
