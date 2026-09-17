import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, footer, children, className = '' }) => {
  return (
    <div className={`bg-surface rounded-card shadow-card border border-surface-border overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-surface-border">
          {title && <h3 className="text-lg font-medium text-ink-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-surface-muted border-t border-surface-border">
          {footer}
        </div>
      )}
    </div>
  );
};
