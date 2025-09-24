import React from 'react';
import { Outlet, redirect } from '@tanstack/react-router';
import { useAuthStatus } from '@/features/accounts/hooks/useAuth';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';


export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStatus();


  if (isLoading) {
    return (
      <div className="min-h-screen bg-nordic-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }


  if (!isAuthenticated) {
    const redirectResult = redirect({ to: '/login' });
    const redirectError = Object.assign(new Error('Authentication required'), redirectResult);
    redirectError.name = 'RedirectError';
    throw redirectError;
  }


  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};
