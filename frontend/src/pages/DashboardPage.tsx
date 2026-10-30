import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Mic, History, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { backendStatus, mlStatus } = useSystemHealth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">
            Welcome back, {user?.fullName.split(' ')[0]}!
          </h1>
          <p className="text-sm text-ink-500">
            Track your interview preparedness across behavioral fluency and technical algorithm mastery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/record"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Mic className="w-4 h-4" />
            Behavioral Practice
          </Link>
          <Link
            to="/technical"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Code2 className="w-4 h-4" />
            Technical Assessment
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs font-bold uppercase tracking-wider text-ink-500">Interviews Completed</div>
          <div className="mt-2 text-3xl font-extrabold text-ink-900">—</div>
          <div className="mt-1 text-xs text-ink-400">Audio recordings analyzed</div>
        </Card>
        <Card>
          <div className="text-xs font-bold uppercase tracking-wider text-ink-500">Avg Confidence</div>
          <div className="mt-2 text-3xl font-extrabold text-ink-900">—</div>
          <div className="mt-1 text-xs text-ink-400">Acoustic pitch & pacing score</div>
        </Card>
        <Card>
          <div className="text-xs font-bold uppercase tracking-wider text-ink-500">Avg Fluency</div>
          <div className="mt-2 text-3xl font-extrabold text-ink-900">—</div>
          <div className="mt-1 text-xs text-ink-400">Words per minute & pauses</div>
        </Card>
        <Card>
          <div className="text-xs font-bold uppercase tracking-wider text-ink-500">Technical Mastery</div>
          <div className="mt-2 text-3xl font-extrabold text-indigo-600">Active</div>
          <div className="mt-1 text-xs text-indigo-500 font-medium">Algorithmic sandbox live</div>
        </Card>
      </div>

      {/* Feature Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Technical Assessment Spotlight */}
        <div className="lg:col-span-8 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#172554] rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Technical Assessment Engine
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Sharpen Your Technical Problem Solving</h2>
            <p className="text-slate-200 text-sm leading-relaxed max-w-xl">
              Solve LeetCode-style algorithmic coding challenges in Python with real-time test verification, or test your architectural knowledge with conceptual questions evaluated by NLP semantic similarity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/technical"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition"
            >
              Open Technical Center
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/technical/attempts"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition"
            >
              <History className="w-3.5 h-3.5" />
              View Past Attempts
            </Link>
          </div>
        </div>

        {/* System Health Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-surface-border p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-ink-900">Platform Telemetry</h3>
            <p className="text-xs text-ink-500 mt-1">
              Real-time gateway and ML evaluation health status.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-surface-muted rounded-xl border border-surface-border">
              <span className="text-xs font-semibold text-ink-900">API Gateway</span>
              <StatusBadge
                status={backendStatus}
                label={backendStatus.charAt(0).toUpperCase() + backendStatus.slice(1)}
              />
            </div>
            <div className="flex items-center justify-between p-3.5 bg-surface-muted rounded-xl border border-surface-border">
              <span className="text-xs font-semibold text-ink-900">ML Evaluation Service</span>
              <StatusBadge
                status={mlStatus}
                label={mlStatus.charAt(0).toUpperCase() + mlStatus.slice(1)}
              />
            </div>
          </div>

          <div className="text-[11px] text-ink-400 text-center pt-2">
            Connected to Node.js Gateway & FastAPI Subprocess Sandbox
          </div>
        </div>
      </div>
    </div>
  );
};
