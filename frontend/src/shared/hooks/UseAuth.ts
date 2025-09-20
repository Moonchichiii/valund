import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  authApi,
  type User,
  type LoginCredentials,
  type RegisterData,
  type OAuthExchangeData,
  type BankIDStartData
} from '@/api/auth';
import { setAccessToken } from '@/api/client';

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  bankid: (orderRef: string) => [...authKeys.all, 'bankid', orderRef] as const,
};

// User Query Hook
export function useUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: Infinity, // User data shouldn't go stale
  });
}

// Auth Status Hook (main hook for components)
export function useAuthStatus() {
  const { data: user, isLoading, error } = useUser();

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
  };
}

// Login Mutation
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Set token if provided (fallback for non-cookie auth)
      if (data.tokens?.access) {
        setAccessToken(data.tokens.access);
      }
      // Update user in cache
      queryClient.setQueryData(authKeys.user(), data.user);
      toast.success('Login successful!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed');
    },
  });
}

// Register Mutation
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      if (data.tokens?.access) {
        setAccessToken(data.tokens.access);
      }
      queryClient.setQueryData(authKeys.user(), data.user);
      toast.success('Registration successful!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed');
    },
  });
}

// Logout Mutation
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear token
      setAccessToken(null);
      // Clear all auth-related cache
      queryClient.removeQueries({ queryKey: authKeys.all });
      // Clear user data specifically
      queryClient.setQueryData(authKeys.user(), null);
      toast.success('Logged out successfully');
    },
    onError: (error: Error) => {
      // Still clear local state even if server logout fails
      setAccessToken(null);
      queryClient.removeQueries({ queryKey: authKeys.all });
      queryClient.setQueryData(authKeys.user(), null);
      toast.error(error.message || 'Logout failed');
    },
  });
}

// OAuth Exchange Mutation
export function useOAuthExchange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.oauthExchange,
    onSuccess: (data) => {
      if (data.tokens?.access) {
        setAccessToken(data.tokens.access);
      }
      queryClient.setQueryData(authKeys.user(), data.user);
      toast.success('OAuth login successful!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'OAuth authentication failed');
    },
  });
}

// BankID Auth Hook
export function useBankIDAuth(orderRef?: string) {
  const queryClient = useQueryClient();

  // Start BankID authentication
  const startMutation = useMutation({
    mutationFn: authApi.bankidStart,
    onError: (error: Error) => {
      toast.error(error.message || 'BankID start failed');
    },
  });

  // Poll BankID status
  const statusQuery = useQuery({
    queryKey: authKeys.bankid(orderRef || ''),
    queryFn: () => authApi.bankidStatus(orderRef!),
    enabled: !!orderRef,
    refetchInterval: (data) => {
      // Stop polling if complete or failed
      return data?.status === 'pending' ? 2000 : false;
    },
    onSuccess: (data) => {
      if (data.status === 'complete' && data.tokens && data.user) {
        setAccessToken(data.tokens.access);
        queryClient.setQueryData(authKeys.user(), data.user);
        toast.success('BankID authentication successful!');
      }
    },
  });

  const cancelPolling = () => {
    if (orderRef) {
      queryClient.removeQueries({ queryKey: authKeys.bankid(orderRef) });
    }
  };

  return {
    start: startMutation.mutate,
    isStarting: startMutation.isPending,
    orderRef: startMutation.data?.order_ref,
    autoStartToken: startMutation.data?.auto_start_token,
    status: statusQuery.data?.status,
    isPolling: statusQuery.isFetching,
    error: startMutation.error || statusQuery.error,
    cancelPolling,
  };
}

// Password Reset Hooks
export function usePasswordReset() {
  return useMutation({
    mutationFn: authApi.requestPasswordReset,
    onSuccess: () => {
      toast.success('Password reset email sent!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Password reset failed');
    },
  });
}

export function usePasswordResetConfirm() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.confirmPasswordReset(token, password),
    onSuccess: () => {
      toast.success('Password reset successful!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Password reset confirmation failed');
    },
  });
}
