import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mic, Code2, History } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/dashboard') return currentPath === '/dashboard';
    return currentPath.startsWith(path);
  };

  return (
    <aside
      id="logo-sidebar"
      className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-surface border-r border-surface-border md:translate-x-0"
      aria-label="Sidebar"
    >
      <div className="h-full px-3 pb-4 overflow-y-auto bg-surface flex flex-col justify-between">
        <ul className="space-y-1.5 font-medium">
          <li>
            <Link
              to="/dashboard"
              className={`flex items-center p-2.5 rounded-xl text-sm transition group ${
                isActive('/dashboard')
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm'
                  : 'text-ink-700 hover:bg-surface-muted hover:text-brand-600'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-brand-600 mr-3" />
              <span>Dashboard</span>
            </Link>
          </li>

          <li>
            <Link
              to="/record"
              className={`flex items-center p-2.5 rounded-xl text-sm transition group ${
                isActive('/record')
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm'
                  : 'text-ink-700 hover:bg-surface-muted hover:text-brand-600'
              }`}
            >
              <Mic className="w-4 h-4 text-emerald-600 mr-3" />
              <span>Behavioral Practice</span>
            </Link>
          </li>

          <li>
            <Link
              to="/technical"
              className={`flex items-center p-2.5 rounded-xl text-sm transition group ${
                isActive('/technical') && !isActive('/technical/attempts')
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm'
                  : 'text-ink-700 hover:bg-surface-muted hover:text-brand-600'
              }`}
            >
              <Code2 className="w-4 h-4 text-indigo-600 mr-3" />
              <span className="flex-1">Technical Assessment</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-brand-100 text-brand-800">
                New
              </span>
            </Link>
          </li>

          <li>
            <Link
              to="/technical/attempts"
              className={`flex items-center p-2.5 rounded-xl text-sm transition group ${
                isActive('/technical/attempts')
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm'
                  : 'text-ink-700 hover:bg-surface-muted hover:text-brand-600'
              }`}
            >
              <History className="w-4 h-4 text-amber-600 mr-3" />
              <span>Past Attempts</span>
            </Link>
          </li>
        </ul>

        {/* System Version Footer */}
        <div className="p-3 bg-surface-muted rounded-xl border border-surface-border text-center space-y-1">
          <div className="text-[11px] font-bold text-ink-700 uppercase tracking-wider">
            AI Interview Coach
          </div>
          <div className="text-[10px] text-ink-400">Week 3 & 4 Milestone</div>
        </div>
      </div>
    </aside>
  );
};
