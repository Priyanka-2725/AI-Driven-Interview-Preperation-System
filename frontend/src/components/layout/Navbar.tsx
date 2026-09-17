import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 z-50 w-full bg-surface border-b border-surface-border">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start rtl:justify-end">
            <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-brand-600">
              AI Interview Coach
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm font-medium text-ink-700 hidden sm:block">
                  {user.fullName}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Log out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
