import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-muted flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-9xl font-extrabold text-brand-600">404</h1>
        <h2 className="text-3xl font-bold text-ink-900 mt-4">Page Not Found</h2>
        <p className="text-ink-500 mt-2">The page you are looking for does not exist or has been moved.</p>
        <div className="mt-8">
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
