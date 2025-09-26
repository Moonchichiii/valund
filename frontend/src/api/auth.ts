// src/api/auth.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import type {
  AuthResponse,
  LoginRequest,
  PasswordChangeRequest,
  RegisterRequest,
  User,
  UserSession,
} from '@/features/accounts/types/auth';

/* ======================================================================================
 * Axios client + tokens + CSRF + error helpers
 * ==================================================================================== */

const rawApiUrl = (import.meta.env as Record<string, unknown>).VITE_API_URL;
const API_ORIGIN: string = (typeof rawApiUrl === 'string' ? rawApiUrl : 'http://localhost:8000').replace(/\/+$/, '');

export const authClient = axios.create({
  baseURL: `${API_ORIGIN}/api/auth/`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

let ACCESS_TOKEN: string | null = null;
export const setAccessToken = (token: string | null): void => {
  ACCESS_TOKEN = token;
};
export const getAccessToken = (): string | null => ACCESS_TOKEN;

const DEV = !!import.meta.env.DEV;

// CSRF seeding - only when needed
const seedCsrf = async (): Promise<void> => {
  try {
    await authClient.get('csrf/');
  } catch {
    // EnsureCSRFCookieOnSafeMethodsMiddleware handles this automatically
  }
};

// Check if CSRF cookie exists
const hasCsrfCookie = (): boolean => document.cookie.includes('csrftoken=');

// Request interceptor - attach access token
authClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (ACCESS_TOKEN) {
      (config.headers as Record<string, string>).Authorization = `Bearer ${ACCESS_TOKEN}`;
    }
    return config;
  },
  (err) => Promise.reject(err instanceof Error ? err : new Error(String(err))),
);

// Response interceptor - handle auth failures and token refresh
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

authClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Handle 401 - token expired, attempt refresh
    if (status === 401 && original && !original._retry && !original.url?.includes('refresh/')) {
      original._retry = true;

      // Prevent concurrent refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async (): Promise<string> => {
          try {
            const { data } = await authClient.post<{ access: string }>('refresh/');
            setAccessToken(data.access);
            return data.access;
          } catch {
            setAccessToken(null);
            throw new Error('Token refresh failed');
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();
      }

      try {
        const newToken = await refreshPromise!;
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return authClient(original);
      } catch {
        setAccessToken(null);
        throw error; // Re-throw original 401 error
      }
    }

    throw error;
  },
);

// Enhanced error handling + extraction
interface ApiErrorData {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  non_field_errors?: string[];
}

const handleError = (error: unknown): never => {
  if (axios.isAxiosError<ApiErrorData>(error)) {
    const response = error.response;

    if (response?.status === 401) {
      setAccessToken(null);
      throw new Error('Authentication failed. Please sign in again.');
    }

    if (response?.status === 403) {
      const detail = response.data?.detail ?? '';
      if (detail.toLowerCase().includes('csrf')) {
        throw new Error('Security token expired. Please try again.');
      }
      throw new Error('Access forbidden. Please check your permissions.');
    }

    // Validation errors
    const errorsObj = response?.data?.errors;
    if (errorsObj && Object.keys(errorsObj).length > 0) {
      const firstKey = Object.keys(errorsObj)[0];
      const firstError = errorsObj[firstKey];
      const errorMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
      throw new Error(errorMsg);
    }

    // Non-field errors
    const nonFieldErrors = response?.data?.non_field_errors;
    if (nonFieldErrors && Array.isArray(nonFieldErrors) && nonFieldErrors.length > 0) {
      throw new Error(nonFieldErrors[0]);
    }

    const msg = response?.data?.detail ?? response?.data?.message ?? error.message;
    throw new Error(msg);
  }

  throw new Error(error instanceof Error ? error.message : 'An unexpected error occurred');
};

// For toasts in hooks
const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;

  const err = error as AxiosError<ApiErrorData>;
  const errors = err.response?.data?.errors;
  if (errors && Object.keys(errors).length > 0) {
    const firstKey = Object.keys(errors)[0];
    const firstError = errors[firstKey];
    return Array.isArray(firstError) && firstError.length > 0 ? firstError[0] : 'Validation error';
  }
  const nonFieldErrors = err.response?.data?.non_field_errors;
  if (nonFieldErrors && Array.isArray(nonFieldErrors) && nonFieldErrors.length > 0) {
    return nonFieldErrors[0];
  }
  return err.response?.data?.detail ?? err.response?.data?.message ?? err.message ?? 'An unexpected error occurred';
};

// CSRF retry wrapper
const withCsrfRetry = async <T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const err = error as AxiosError<ApiErrorData>;
      const isCsrf403 =
        axios.isAxiosError(err) &&
        err.response?.status === 403 &&
        (err.response?.data?.detail ?? '').toLowerCase().includes('csrf');

      if (isCsrf403 && attempt < maxRetries) {
        await seedCsrf();
        continue;
      }
      break;
    }
  }

  return handleError(lastError);
};

// Rate limiter for login attempts
class RateLimiter {
  private readonly attempts = new Map<string, { count: number; resetTime: number }>();

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  clear(key: string): void {
    this.attempts.delete(key);
  }
}

const rateLimiter = new RateLimiter();

/* ======================================================================================
 * Public API (authApi)
 * ==================================================================================== */

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const key = `login_${payload.email}`;
    if (!rateLimiter.isAllowed(key, 5, 15 * 60 * 1000)) {
      throw new Error('Too many login attempts. Try again in 15 minutes.');
    }

    try {
      const result = await withCsrfRetry(async () => {
        const res = await authClient.post<AuthResponse>('login/', payload);
        setAccessToken(res.data.tokens.access);
        return res.data;
      });

      rateLimiter.clear(key);
      return result;
    } catch (error) {
      throw error;
    }
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    return withCsrfRetry(async () => {
      const res = await authClient.post<AuthResponse>('register/', payload);
      setAccessToken(res.data.tokens.access);
      return res.data;
    });
  },

  async logout(): Promise<void> {
    try {
      await withCsrfRetry(() => authClient.post('logout/'));
    } catch (error) {
      if (DEV) console.warn('Logout API call failed:', error);
    } finally {
      setAccessToken(null);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await authClient.get<User>('me/');
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setAccessToken(null);
        return null;
      }
      return handleError(error);
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    return withCsrfRetry(async () => {
      const res = await authClient.patch<User>('me/', updates);
      return res.data;
    });
  },

  async changePassword(payload: PasswordChangeRequest): Promise<void> {
    return withCsrfRetry(async () => {
      await authClient.post('change-password/', payload);
    });
  },

  async getUserSessions(): Promise<UserSession[]> {
    try {
      const res = await authClient.get<UserSession[]>('sessions/');
      return res.data;
    } catch (error) {
      return handleError(error);
    }
  },

  async terminateSession(sessionId: string): Promise<void> {
    return withCsrfRetry(async () => {
      await authClient.delete(`sessions/${encodeURIComponent(sessionId)}/`);
    });
  },

  // Utilities
  async checkCsrf(): Promise<void> {
    if (!hasCsrfCookie()) {
      await seedCsrf();
    }
  },

  clearTokens(): void {
    setAccessToken(null);
  },
};

/* ======================================================================================
 * Local persistence (for optimistic UX)
 * ==================================================================================== */

const STORAGE_KEY = 'valunds-user-profile';

const persistUser = (user: User | null): void => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    if (DEV) {
      console.warn('Failed to persist user to localStorage:', error);
    }
  }
};

const getPersistedUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    if (DEV) {
      console.warn('Failed to parse persisted user from localStorage:', error);
    }
    return null;
  }
};

/* ======================================================================================
 * Auth status helpers + React Query hooks
 * ==================================================================================== */

const hasRefreshCookie = (): boolean => document.cookie.includes('refresh_token=');
const shouldQueryMe = (): boolean => Boolean(getAccessToken()) || hasRefreshCookie();

// Core user query
export const useUser = (): UseQueryResult<User | null> =>
  useQuery<User | null>({
    queryKey: ['auth', 'me'],
    enabled: shouldQueryMe(),
    initialData: getPersistedUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    queryFn: async (): Promise<User | null> => {
      const user = await authApi.getCurrentUser();
      persistUser(user);
      return user;
    },
  });

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

// Login
export const useLogin = (): UseMutationResult<AuthResponse, unknown, LoginRequest> => {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, unknown, LoginRequest>({
    mutationFn: (data) => authApi.login(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
      persistUser(data.user);

      void queryClient.invalidateQueries({ queryKey: ['auth'] });

      void queryClient.prefetchQuery({
        queryKey: ['auth', 'sessions'],
        queryFn: () => authApi.getUserSessions(),
        staleTime: 2 * 60 * 1000,
      });

      toast.success('Welcome back!');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

// Register
export const useRegister = (): UseMutationResult<AuthResponse, unknown, RegisterRequest> => {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, unknown, RegisterRequest>({
    mutationFn: (data) => authApi.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
      persistUser(data.user);
      void queryClient.invalidateQueries({ queryKey: ['auth'] });

      void queryClient.prefetchQuery({
        queryKey: ['auth', 'sessions'],
        queryFn: () => authApi.getUserSessions(),
      });

      toast.success('Welcome to Valunds!');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

// Logout (always clears local state)
export const useLogout = (): UseMutationResult<void, unknown, void> => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, void>({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.removeQueries({ queryKey: ['auth'] });
      persistUser(null);
      setAccessToken(null);
    },
    onSuccess: () => {
      toast.success('Signed out successfully');
    },
    onError: () => {
      toast.success('Signed out successfully');
    },
  });
};

// Update profile with optimistic updates
interface UpdateProfileMutationContext {
  previousUser?: User;
}

export const useUpdateProfile = (): UseMutationResult<User, unknown, Partial<User>, UpdateProfileMutationContext> => {
  const queryClient = useQueryClient();

  return useMutation<User, unknown, Partial<User>, UpdateProfileMutationContext>({
    mutationFn: (data) => authApi.updateProfile(data),
    onMutate: async (updates): Promise<UpdateProfileMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ['auth', 'me'] });

      const previousUser = queryClient.getQueryData<User>(['auth', 'me']);

      if (previousUser) {
        const optimisticUser = { ...previousUser, ...updates };
        queryClient.setQueryData(['auth', 'me'], optimisticUser);
        persistUser(optimisticUser);
      }

      return { previousUser: previousUser ?? undefined };
    },
    onError: (error, _updates, context) => {
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

// Change password
export const useChangePassword = (): UseMutationResult<void, unknown, PasswordChangeRequest> =>
  useMutation<void, unknown, PasswordChangeRequest>({
    mutationFn: (payload) => authApi.changePassword(payload),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

// Sessions
export const useUserSessions = (): UseQueryResult<UserSession[]> =>
  useQuery<UserSession[]>({
    queryKey: ['auth', 'sessions'],
    queryFn: () => authApi.getUserSessions(),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(getAccessToken()),
    refetchOnWindowFocus: false,
  });

export const useTerminateSession = (): UseMutationResult<void, unknown, string> => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: (sessionId) => authApi.terminateSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
      toast.success('Session terminated');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

/* ======================================================================================
 * Password strength: util + hook
 * ==================================================================================== */

export const checkPasswordStrength = (password: string): { score: number; feedback: string[] } => {
  if (!password) return { score: 0, feedback: ['Enter a password'] };

  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 12) score++;
  else feedback.push('Use at least 12 characters');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score++;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Add special characters');

  if (password.length >= 16) score = Math.min(score + 0.5, 5);

  return {
    score: Math.max(0, Math.floor(score)),
    feedback: score >= 4 ? [] : feedback,
  };
};

export const usePasswordStrength = (password: string): { score: number; feedback: string[] } =>
  checkPasswordStrength(password);
