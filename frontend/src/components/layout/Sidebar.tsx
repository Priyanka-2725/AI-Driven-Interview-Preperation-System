import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <aside id="logo-sidebar" className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-surface border-r border-surface-border md:translate-x-0" aria-label="Sidebar">
      <div className="h-full px-3 pb-4 overflow-y-auto bg-surface">
        <ul className="space-y-2 font-medium">
          <li>
            <Link to="/dashboard" className={`flex items-center p-2 rounded-lg group ${isActive('/dashboard') ? 'bg-surface-muted text-brand-600' : 'text-ink-900 hover:bg-surface-muted hover:text-brand-600'}`}>
              <span className="ms-3">Dashboard</span>
            </Link>
          </li>
          <li>
            <div className="flex items-center p-2 text-ink-500 rounded-lg opacity-60 cursor-not-allowed group">
              <span className="flex-1 ms-3 whitespace-nowrap">Interview</span>
              <span className="inline-flex items-center justify-center px-2 ms-3 text-sm font-medium text-ink-700 bg-surface-border rounded-full">Soon</span>
            </div>
          </li>
          <li>
            <div className="flex items-center p-2 text-ink-500 rounded-lg opacity-60 cursor-not-allowed group">
              <span className="flex-1 ms-3 whitespace-nowrap">History</span>
              <span className="inline-flex items-center justify-center px-2 ms-3 text-sm font-medium text-ink-700 bg-surface-border rounded-full">Soon</span>
            </div>
          </li>
          <li>
            <div className="flex items-center p-2 text-ink-500 rounded-lg opacity-60 cursor-not-allowed group">
              <span className="flex-1 ms-3 whitespace-nowrap">Settings</span>
              <span className="inline-flex items-center justify-center px-2 ms-3 text-sm font-medium text-ink-700 bg-surface-border rounded-full">Soon</span>
            </div>
          </li>
        </ul>
      </div>
    </aside>
  );
};
