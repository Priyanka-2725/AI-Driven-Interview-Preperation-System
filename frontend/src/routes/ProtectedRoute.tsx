import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';

export const ProtectedRoute: React.FC = () => {
  const { user, isInitialising } = useAuth();
  const location = useLocation();

  if (isInitialising) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-muted">
        <Spinner size="md" label="Checking authentication..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
