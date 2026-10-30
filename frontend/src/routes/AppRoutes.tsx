import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../hooks/useAuth';

import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RecordingPage } from '../pages/RecordingPage';
import { ResultsPage } from '../pages/ResultsPage';
import { TechnicalLandingPage } from '../pages/TechnicalLandingPage';
import { QuestionWorkspacePage } from '../pages/QuestionWorkspacePage';
import { TechnicalResultsPage } from '../pages/TechnicalResultsPage';
import { AttemptHistoryPage } from '../pages/AttemptHistoryPage';

export const AppRoutes: React.FC = () => {
  const { user, isInitialising } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={!isInitialising && user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={!isInitialising && user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/record" element={<RecordingPage />} />
          <Route path="/results/:id" element={<ResultsPage />} />

          {/* Phase 4 Technical Assessment Suite */}
          <Route path="/technical" element={<TechnicalLandingPage />} />
          <Route path="/technical/workspace/:id" element={<QuestionWorkspacePage />} />
          <Route path="/technical/results/:id" element={<TechnicalResultsPage />} />
          <Route path="/technical/attempts" element={<AttemptHistoryPage />} />
          <Route path="/technical/attempts/:id" element={<AttemptHistoryPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
