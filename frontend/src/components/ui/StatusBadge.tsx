import React from 'react';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'checking';
  label: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const colors = {
    online: 'bg-state-success',
    offline: 'bg-state-danger',
    checking: 'bg-state-warn animate-pulse',
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-ink-700 bg-surface border border-surface-border rounded-full shadow-sm">
      <span className={`w-2 h-2 rounded-full ${colors[status]}`} aria-hidden="true"></span>
      {label}
    </span>
  );
};
