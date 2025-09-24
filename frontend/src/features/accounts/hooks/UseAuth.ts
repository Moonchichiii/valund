// src/features/accounts/hooks/useAuth.ts - Complete with all imports

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { authApi } from '../../../api/auth';
import type {
  GeographicAccess,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types/auth';

interface AuthError {
  response?: {
    status: number;
    data?: {
      detail?: string;
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
  message?: string;
}

const extractErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred';
  }

  const authError = error as AuthError;

  // Handle validation errors
  if (authError.response?.data?.errors) {
    const firstErrorKey = Object.keys(authError.response.data.errors)[0];
    const firstError = authError.response.data.errors[firstErrorKey];
    return Array.isArray(firstError) ? firstError[0] : 'Validation error';
  }

  // Handle API error messages
  return (
    authError.response?.data?.detail ??
    authError.response?.data?.message ??
    authError.message ??
    'An unexpected error occurred'
  );
};

export const useUser = (): UseQueryResult<User | null, unknown> =>
  useQuery<User | null>({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<User | null> => {
      try {
        return await authApi.getCurrentUser();
      } catch (error: unknown) {
        const authError = error as AuthError;
        if (authError.response?.status === 401) {
          return null; // User not authenticated
        }
        throw error;
      }
    },
    retry: (failureCount: number, error: unknown): boolean => {
      const authError = error as AuthError;
      // Don't retry on auth errors
      if (authError.response?.status === 401 || authError.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

export const useAuthStatus = (): {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null | undefined;
  error: unknown;
} => {
  const userQuery = useUser();
  return {
    isAuthenticated: !!userQuery.data,
    isLoading: userQuery.isLoading,
    user: userQuery.data,
    error: userQuery.error,
  };
};

export const useLogin = (): UseMutationResult<void, unknown, LoginRequest, unknown> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoginRequest): Promise<void> => {
      await authApi.login(payload);
    },
    onSuccess: (): void => {
      // Invalidate and refetch user data
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Welcome back!');
    },
    onError: (error: unknown): void => {
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    },
  });
};

export const useRegister = (): UseMutationResult<void, unknown, RegisterRequest, unknown> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterRequest): Promise<void> => {
      await authApi.register(payload);
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Welcome to Valunds!');
    },
    onError: (error: unknown): void => {
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    },
  });
};

export const useLogout = (): UseMutationResult<void, unknown, void, unknown> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await authApi.logout();
    },
    onSuccess: (): void => {
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.clear();
      toast.success('Signed out successfully');
    },
    onError: (error: unknown): void => {
      // Even if logout fails on server, clear local state
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.clear();
      const errorMessage = extractErrorMessage(error);
      toast.error(`Logout warning: ${errorMessage}`);
    },
  });
};

export const useGeographicAccess = (): UseQueryResult<GeographicAccess, unknown> =>
  useQuery<GeographicAccess>({
    queryKey: ['auth', 'geographic-access'],
    queryFn: async (): Promise<GeographicAccess> => {
      try {
        return await authApi.checkGeographicAccess();
      } catch {
        // Fallback for geographic check failures
        return {
          canUseBankID: false,
          message: 'Geographic access check unavailable',
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

export const useBankIDAuth = (): UseMutationResult<User, unknown, void, unknown> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<User> => {
      // Start BankID authentication
      const startResponse = await authApi.bankidStart();
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes max
      const pollInterval = 2000; // 2 seconds

      while (attempts < maxAttempts) {
        attempts++;

        // Wait before polling
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        try {
          const statusResponse = await authApi.bankidStatus(startResponse.order_ref);

          if (statusResponse.status === 'complete' && statusResponse.user) {
            return statusResponse.user;
          }

          if (statusResponse.status === 'failed') {
            throw new Error('BankID authentication failed');
          }

          if (statusResponse.status === 'cancelled') {
            throw new Error('BankID authentication was cancelled');
          }

          // Continue polling if status is 'pending'
        } catch (error: unknown) {
          const authError = error as AuthError;

          // If it's a network error, continue polling
          if (!authError.response) {
            continue;
          }

          // If it's an API error, throw it
          throw error;
        }
      }

      // Timeout reached
      try {
        await authApi.bankidCancel(startResponse.order_ref);
      } catch {
        // Ignore cancel errors
      }

      throw new Error('BankID authentication timed out');
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Successfully authenticated with BankID');
    },
    onError: (error: unknown): void => {
      const errorMessage = extractErrorMessage(error);

      if (errorMessage.toLowerCase().includes('region') ||
          errorMessage.toLowerCase().includes('geographic')) {
        toast.error('BankID is only available from Swedish IP addresses');
      } else if (errorMessage.toLowerCase().includes('timeout')) {
        toast.error('BankID authentication timed out. Please try again.');
      } else if (errorMessage.toLowerCase().includes('cancelled')) {
        toast.error('BankID authentication was cancelled');
      } else {
        toast.error('BankID authentication failed. Please try again.');
      }
    },
  });
};
