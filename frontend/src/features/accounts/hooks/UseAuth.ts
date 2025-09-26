import {
  useMutation,
  type UseMutationResult,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { authApi, getAccessToken, setAccessToken } from '@/api/auth';
import type {
  AuthResponse,
  LoginRequest,
  PasswordChangeRequest,
  RegisterRequest,
  User,
  UserSession,
} from '../types/auth';

interface AuthError {
  response?: {
    status: number;
    data?: {
      detail?: string;
      message?: string;
      errors?: Record<string, string[]>
    }
  };
  message?: string;
}

// Persistence helpers
const STORAGE_KEY = 'valunds-user-profile';

const persistUser = (user: User | null): void => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage not available or quota exceeded
  }
};

const getPersistedUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as User : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

// Error message extraction
const extractErrorMessage = (error: unknown): string => {
  const err = error as AuthError;
  const errors = err.response?.data?.errors;
  if (errors) {
    const firstKey = Object.keys(errors)[0];
    const first = errors[firstKey];
    return Array.isArray(first) ? first[0] : 'Validation error';
  }
  return err.response?.data?.detail ??
         err.response?.data?.message ??
         err.message ??
         'An unexpected error occurred';
};

// Check for refresh cookie
const hasRefreshCookie = (): boolean =>
  document.cookie.includes('refresh_token=');

// Query enabler - only query when we have tokens
const shouldQueryMe = (): boolean =>
  Boolean(getAccessToken()) || hasRefreshCookie();

// Core user query with optimistic updates
export const useUser = (): UseQueryResult<User | null> =>
  useQuery<User | null>({
    queryKey: ['auth', 'me'],
    enabled: shouldQueryMe(),
    initialData: getPersistedUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    queryFn: async (): Promise<User | null> => {
      const user = await authApi.getCurrentUser();
      persistUser(user);
      return user;
    },
  });

// Consolidated auth status
export const useAuthStatus = (): {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: unknown;
} => {
  const { data, isLoading, isPending, error } = useUser();
  return {
    isAuthenticated: Boolean(data),
    isLoading: isLoading || isPending,
    user: data ?? null,
    error,
  };
};

// Login mutation with optimistic updates
export const useLogin = (): UseMutationResult<AuthResponse, unknown, LoginRequest> => {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, unknown, LoginRequest>({
    mutationFn: (data) => authApi.login(data),
    onSuccess: (data) => {
      // Optimistically update user data
      queryClient.setQueryData(['auth', 'me'], data.user);
      persistUser(data.user);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      // Prefetch user sessions for dashboard
      queryClient.prefetchQuery({
        queryKey: ['auth', 'sessions'],
        queryFn: () => authApi.getUserSessions(),
        staleTime: 2 * 60 * 1000,
      });

      toast.success('Welcome back!');
    },
    onError: (e) => {
      const message = extractErrorMessage(e);
      toast.error(message);
    },
  });
};

// Registration mutation
export const useRegister = (): UseMutationResult<AuthResponse, unknown, RegisterRequest> => {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, unknown, RegisterRequest>({
    mutationFn: (data) => authApi.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
      persistUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      // Prefetch for new users
      queryClient.prefetchQuery({
        queryKey: ['auth', 'sessions'],
        queryFn: () => authApi.getUserSessions(),
      });

      toast.success('Welcome to Valunds!');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
};

// Logout mutation - always succeeds from UI perspective
export const useLogout = (): UseMutationResult<void, unknown, void> => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown>({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      // Always clear auth state regardless of API response
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.removeQueries({ queryKey: ['auth'] });
      persistUser(null);
      setAccessToken(null);
    },
    onSuccess: () => {
      toast.success('Signed out successfully');
    },
    onError: () => {
      // Even if logout API fails, we've cleared local state
      toast.success('Signed out successfully');
    },
  });
};

// Profile update with optimistic updates
export const useUpdateProfile = (): UseMutationResult<User, unknown, Partial<User>> => {
  const queryClient = useQueryClient();

  return useMutation<User, unknown, Partial<User>>({
    mutationFn: (data) => authApi.updateProfile(data),
    onMutate: async (updates) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['auth', 'me'] });

      // Snapshot current data
      const previousUser = queryClient.getQueryData<User>(['auth', 'me']);

      // Optimistically update
      if (previousUser) {
        const optimisticUser = { ...previousUser, ...updates };
        queryClient.setQueryData(['auth', 'me'], optimisticUser);
        persistUser(optimisticUser);
      }

      return { previousUser };
    },
    onError: (error, updates, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(['auth', 'me'], context.previousUser);
        persistUser(context.previousUser);
      }
      toast.error(extractErrorMessage(error));
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth', 'me'], updatedUser);
      persistUser(updatedUser);
      toast.success('Profile updated successfully');
    },
  });
};

// Password change
export const useChangePassword = (): UseMutationResult<void, unknown, PasswordChangeRequest> =>
  useMutation<void, unknown, PasswordChangeRequest>({
    mutationFn: (payload) => authApi.changePassword(payload),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (e) => {
      toast.error(extractErrorMessage(e));
    },
  });

// User sessions
export const useUserSessions = (): UseQueryResult<UserSession[]> =>
  useQuery<UserSession[]>({
    queryKey: ['auth', 'sessions'],
    queryFn: () => authApi.getUserSessions(),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(getAccessToken()),
    refetchOnWindowFocus: false,
  });

// Session termination
export const useTerminateSession = (): UseMutationResult<void, unknown, string> => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: (id) => authApi.terminateSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
      toast.success('Session terminated');
    },
    onError: (e) => {
      toast.error(extractErrorMessage(e));
    },
  });
};


// Password strength utility hook
export const usePasswordStrength = (password: string): { score: number; feedback: string[] } => {
  if (!password) return { score: 0, feedback: ['Enter a password'] };

  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 12) score++; else feedback.push('Use at least 12 characters');
  if (/[a-z]/.test(password)) score++; else feedback.push('Add lowercase letters');
  if (/[A-Z]/.test(password)) score++; else feedback.push('Add uppercase letters');
  if (/\d/.test(password)) score++; else feedback.push('Add numbers');
  if (/[^a-zA-Z0-9]/.test(password)) score++; else feedback.push('Add special characters');

  return {
    score: Math.max(0, score),
    feedback: score >= 4 ? [] : feedback
  };
};
