import { useMutation, type UseMutationResult, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { authApi } from '@/api/auth';
import type {
  AuthResponse,
  GeographicAccess,
  LoginRequest,
  PasswordChangeRequest,
  RegisterRequest,
  SecurityLog,
  User,
  UserSession,
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

// Persistence helper
const STORAGE_KEY = 'valunds-user-profile';

const persistUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

const getPersistedUser = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const extractErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred';
  }

  const authError = error as AuthError;

  if (authError.response?.data?.errors) {
    const firstErrorKey = Object.keys(authError.response.data.errors)[0];
    const firstError = authError.response.data.errors[firstErrorKey];
    return Array.isArray(firstError) ? firstError[0] : 'Validation error';
  }

  return (
    authError.response?.data?.detail ??
    authError.response?.data?.message ??
    authError.message ??
    'An unexpected error occurred'
  );
};

// Core user query with persistence
export const useUser = (): UseQueryResult<User | null, Error> =>
  useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<User | null> => {
      try {
        const user = await authApi.getCurrentUser();
        persistUser(user);
        return user;
      } catch (error: unknown) {
        const authError = error as AuthError;
        if (authError.response?.status === 401) {
          persistUser(null);
          return null;
        }
        throw error;
      }
    },
    retry: (failureCount: number, error: unknown): boolean => {
      const authError = error as AuthError;
      if (authError.response?.status === 401 || authError.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialData: getPersistedUser,
  });

export const useAuthStatus = (): {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null | undefined;
  error: unknown;
} => {
  const userQuery = useUser();
  return {
    isAuthenticated: Boolean(userQuery.data),
    isLoading: userQuery.isLoading,
    user: userQuery.data,
    error: userQuery.error,
  };
};

// Enhanced login with user data caching + debug logs
export const useLogin = (): UseMutationResult<AuthResponse, unknown, LoginRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<AuthResponse> => {
      console.log('[Auth][Login] Attempting login', {
        email: credentials.email,
        timestamp: new Date().toISOString(),
      });
      try {
        const result = await authApi.login(credentials);
        console.log('[Auth][Login] API success', {
          userId: result.user?.id,
          email: result.user?.email,
        });
        return result;
      } catch (err) {
        console.error('[Auth][Login] API error', {
          email: credentials.email,
          error: err,
        });
        throw err;
      }
    },
    onSuccess: (data): void => {
      console.log('[Auth][Login] onSuccess - caching user', {
        userId: data.user?.id,
      });
      queryClient.setQueryData(['auth', 'me'], data.user);
      persistUser(data.user);
      toast.success('Welcome back!');
    },
    onError: (error: unknown): void => {
      const errorMessage = extractErrorMessage(error);
      console.error('[Auth][Login] onError', {
        message: errorMessage,
        raw: error,
      });
      toast.error(errorMessage);
    },
  });
};

// Enhanced register with user data caching + debug logs
export const useRegister = (): UseMutationResult<AuthResponse, unknown, RegisterRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterRequest): Promise<AuthResponse> => {
      console.log('[Auth][Register] Attempting registration', {
        email: (payload as { email?: string }).email,
        timestamp: new Date().toISOString(),
      });
      try {
        const result = await authApi.register(payload);
        console.log('[Auth][Register] API success', {
          userId: result.user?.id,
          email: result.user?.email,
        });
        return result;
      } catch (err) {
        console.error('[Auth][Register] API error', {
          email: (payload as { email?: string }).email,
          error: err,
        });
        throw err;
      }
    },
    onSuccess: (data): void => {
      console.log('[Auth][Register] onSuccess - caching user', {
        userId: data.user?.id,
      });
      queryClient.setQueryData(['auth', 'me'], data.user);
      persistUser(data.user);
      toast.success('Welcome to Valunds!');
    },
    onError: (error: unknown): void => {
      const errorMessage = extractErrorMessage(error);
      console.error('[Auth][Register] onError', {
        message: errorMessage,
        raw: error,
      });
      toast.error(errorMessage);
    },
  });
};

export const useLogout = (): UseMutationResult<void, unknown, void> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: (): void => {
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.clear();
      persistUser(null);
      toast.success('Signed out successfully');
    },
    onError: (error: unknown): void => {
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.clear();
      persistUser(null);
      const errorMessage = extractErrorMessage(error);
      toast.error(`Logout warning: ${errorMessage}`);
    },
  });
};

// Profile update with cache sync
export const useUpdateProfile = (): UseMutationResult<User, unknown, Partial<User>> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updatedUser): void => {
      queryClient.setQueryData(['auth', 'me'], updatedUser);
      persistUser(updatedUser);
      toast.success('Profile updated successfully');
    },
    onError: (error: unknown): void => {
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    },
  });
};

// Password change
export const useChangePassword = (): UseMutationResult<void, unknown, PasswordChangeRequest> =>
  useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (): void => {
      toast.success('Password changed successfully');
    },
    onError: (error: unknown): void => {
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    },
  });

// Session management
export const useUserSessions = (): UseQueryResult<UserSession[], Error> =>
  useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: authApi.getUserSessions,
    staleTime: 2 * 60 * 1000,
    // Avoid calling useAuthStatus() (which calls useUser()) here.
    // Use a cheap heuristic: enable if something is persisted.
    enabled: !!getPersistedUser(),
  });

export const useTerminateSession = (): UseMutationResult<void, unknown, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.terminateSession,
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
      toast.success('Session terminated');
    },
    onError: (error: unknown): void => {
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    },
  });
};

// Security logs
export const useSecurityLogs = (): UseQueryResult<SecurityLog[], Error> =>
  useQuery({
    queryKey: ['auth', 'security-logs'],
    queryFn: authApi.getSecurityLogs,
    staleTime: 5 * 60 * 1000,
    enabled: !!getPersistedUser(),
  });

// Geographic access
export const useGeographicAccess = (): UseQueryResult<GeographicAccess, Error> =>
  useQuery({
    queryKey: ['auth', 'geographic-access'],
    queryFn: authApi.checkGeographicAccess,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

// BankID authentication
export const useBankIDAuth = (): UseMutationResult<User, unknown, void> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<User> => {
      const startResponse = await authApi.bankidStart();
      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = 2000;

      while (attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        try {
          const statusResponse = await authApi.bankidStatus(startResponse.order_ref);

          if (statusResponse.status === 'complete' && statusResponse.user) {
            return statusResponse.user;
          }

          if (statusResponse.status === 'failed') {
            throw new Error('BankID authentication failed');
          }
        } catch (error: unknown) {
          const authError = error as AuthError;
          if (!authError.response) {
            continue;
          }
          throw error;
        }
      }

      try {
        await authApi.bankidCancel(startResponse.order_ref);
      } catch {
        // Ignore cancel errors
      }

      throw new Error('BankID authentication timed out');
    },
    onSuccess: (user): void => {
      queryClient.setQueryData(['auth', 'me'], user);
      persistUser(user);
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

// Utility hook for password strength
export const usePasswordStrength = (password: string): { score: number; feedback: string[] } =>
  authApi.checkPasswordStrength(password);
