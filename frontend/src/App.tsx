// App.tsx - Clean routing with React Router
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStatus } from '@/shared/hooks/useAuth';

// Layouts
import { Layout } from '@/app/layouts/Layout';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';

// Marketing Pages
import { Home } from '@/app/pages/Home';
import { About } from '@/app/pages/About';
import { FindTalent } from '@/app/pages/FindTalent';
import { Professionals } from '@/app/pages/Professionals';
import { Contact } from '@/app/pages/Contact';

// Auth Pages
import { LoginPage } from '@/app/pages/auth/LoginPage';
import { RegisterPage } from '@/app/pages/auth/RegisterPage';

// Dashboard
import { Dashboard } from '@/app/pages/dashboard/Dashboard';

// Shared Components
import { CookieConsent } from '@/shared/components/ui/CookieConsent';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nordic-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Auth Guard for login/register (redirect if already authenticated)
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nordic-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-nordic-cream font-inter antialiased">
      <Router>
        <Routes>
          {/* Marketing Pages with Layout */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/find-talent" element={<Layout><FindTalent /></Layout>} />
          <Route path="/professionals" element={<Layout><Professionals /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />

          {/* Auth Pages (no layout - custom styling) */}
          <Route
            path="/login"
            element={
              <AuthGuard>
                <LoginPage />
              </AuthGuard>
            }
          />
          <Route
            path="/register"
            element={
              <AuthGuard>
                <RegisterPage />
              </AuthGuard>
            }
          />

          {/* Protected Dashboard */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Components */}
        <CookieConsent />
      </Router>
    </div>
  );
}

export default App;
