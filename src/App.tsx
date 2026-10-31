import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Tooltips } from './components/Tooltips';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NewSessionPage } from './pages/NewSessionPage';
import { SessionPage } from './pages/SessionPage';
import { HistoryPage } from './pages/HistoryPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-3rem)] items-center justify-center bg-[#f1f5f9]">
        <Loader2
          className="h-6 w-6 animate-spin text-[#0369a1]"
          aria-hidden="true"
        />
        <span className="sr-only">Checking authentication…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Every new page opens at the top, never part-way down the previous page.
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a]">
      <ScrollToTop />
      <Tooltips />
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<Navigate to="/history" replace />} />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new"
          element={
            <ProtectedRoute>
              <NewSessionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/:id"
          element={
            <ProtectedRoute>
              <SessionPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
