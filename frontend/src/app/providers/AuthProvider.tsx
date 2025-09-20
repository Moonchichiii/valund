import React, { createContext, useContext } from 'react';
import { useAuthStatus } from '@/shared/hooks/useAuth';
import type { User } from '@/api/auth';

// Simple context for UI components that need auth state
interface AuthContextValue {
  user: User | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user, isAuthenticated, isLoading, error } = useAuthStatus();

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context (for UI components)
export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Re-export the React Query hooks as the primary interface
export {
  useUser,
  useAuthStatus,
  useLogin,
  useRegister,
  useLogout,
  useOAuthExchange,
  useBankIDAuth,
} from '@/shared/hooks/useAuth';
