import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { backendStatus, mlStatus } = useSystemHealth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Welcome back, {user?.fullName.split(' ')[0]}!</h1>
        <p className="text-ink-500">Here's an overview of your interview performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm font-medium text-ink-500">Interviews Completed</div>
          <div className="mt-2 text-3xl font-bold text-ink-900">—</div>
          <div className="mt-1 text-xs text-ink-400">Available after your first interview</div>
        </Card>
        <Card>
          <div className="text-sm font-medium text-ink-500">Avg Confidence</div>
          <div className="mt-2 text-3xl font-bold text-ink-900">—</div>
          <div className="mt-1 text-xs text-ink-400">Available after your first interview</div>
        </Card>
        <Card>
          <div className="text-sm font-medium text-ink-500">Avg Fluency</div>
          <div className="mt-2 text-3xl font-bold text-ink-900">—</div>
          <div className="mt-1 text-xs text-ink-400">Available after your first interview</div>
        </Card>
        <Card>
          <div className="text-sm font-medium text-ink-500">Avg Technical</div>
          <div className="mt-2 text-3xl font-bold text-ink-900">—</div>
          <div className="mt-1 text-xs text-ink-400">Available after your first interview</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Coming in Week 2">
          <ul className="list-disc list-inside space-y-2 text-ink-700">
            <li>Video and audio recording interface</li>
            <li>Real-time facial landmark extraction</li>
            <li>Submission queue and processing</li>
          </ul>
        </Card>

        <Card title="System Status">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg border border-surface-border">
              <span className="font-medium text-ink-900">API Gateway</span>
              <StatusBadge status={backendStatus} label={backendStatus.charAt(0).toUpperCase() + backendStatus.slice(1)} />
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg border border-surface-border">
              <span className="font-medium text-ink-900">ML Service</span>
              <StatusBadge status={mlStatus} label={mlStatus.charAt(0).toUpperCase() + mlStatus.slice(1)} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
