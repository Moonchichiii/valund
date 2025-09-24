import { apiClient, rootClient, setAccessToken } from './client';
import type {
  AuthResponse,
  BankIDStartResponse,
  BankIDStatusResponse,
  GeographicAccess,
  LoginRequest,
  PasswordChangeRequest,
  RegisterRequest,
  SecurityLog,
  User,
  UserSession,
} from '../features/accounts/types/auth';

// Rate limiting tracker
class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();

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

  getRemainingTime(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;

    const remaining = record.resetTime - Date.now();
    return Math.max(0, remaining);
  }
}

const rateLimiter = new RateLimiter();

// Enhanced error handling
interface ApiError {
  response?: {
    status: number;
    data?: {
      detail?: string;
      message?: string;
      errors?: Record<string, string[]>;
      non_field_errors?: string[];
    };
  };
  request?: unknown;
  message?: string;
}

const handleApiError = (error: unknown): never => {
  const apiError = error as ApiError;

  // Network errors
  if (apiError.request && !apiError.response) {
    throw new Error('Network error. Please check your connection.');
  }

  // Server errors
  if (apiError.response?.status && apiError.response.status >= 500) {
    throw new Error('Server error. Please try again later.');
  }

  // Rate limiting
  if (apiError.response?.status === 429) {
    throw new Error('Too many attempts. Please wait before trying again.');
  }

  // Authentication errors
  if (apiError.response?.status === 401) {
    setAccessToken(null); // Clear invalid token
    throw new Error('Authentication failed. Please sign in again.');
  }

  // Validation errors
  if (apiError.response?.data?.errors) {
    const errors = apiError.response.data.errors;
    const firstError = Object.values(errors)[0];
    const errorMessage = Array.isArray(firstError) ? firstError[0] : 'Validation error';
    throw new Error(errorMessage);
  }

  // API error messages
  const errorMessage =
    apiError.response?.data?.detail ??
    apiError.response?.data?.message ??
    (apiError.response?.data?.non_field_errors?.[0]) ??
    apiError.message ??
    'An unexpected error occurred';

  throw new Error(errorMessage);
};

// Security helpers
const validateInput = (data: unknown): void => {
  if (typeof data !== 'object' || data === null) {
    return;
  }
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (typeof value === 'string') {
      // Check for potential XSS
      if (/<script|javascript:|data:|vbscript:/i.test(value)) {
        throw new Error(`Invalid input detected in ${key}`);
      }

      // Check for SQL injection patterns
      if (/(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)|([';])/i.test(value)) {
        throw new Error(`Invalid input detected in ${key}`);
      }
    }
  }
};

// Browser fingerprint generator
const generateFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    `${String(screen.width)}x${String(screen.height)}`,
    String(new Date().getTimezoneOffset()),
    String(!!window.sessionStorage),
    String(!!window.localStorage),
    String(!!window.indexedDB),
    canvas.toDataURL(),
  ].join('|');

  return btoa(fingerprint).slice(0, 32);
};

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    // Client-side rate limiting
    const clientKey = `login_${payload.email}`;
    if (!rateLimiter.isAllowed(clientKey, 5, 15 * 60 * 1000)) { // 5 attempts per 15 minutes
      const remaining = rateLimiter.getRemainingTime(clientKey);
      throw new Error(`Too many login attempts. Try again in ${String(Math.ceil(remaining / 60000))} minutes.`);
    }

    // Input validation
    validateInput(payload);

    if (!payload.email || !payload.password) {
      throw new Error('Email and password are required');
    }

    if (payload.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    try {
      const response = await apiClient.post<AuthResponse>('/login/', {
        ...payload,
        fingerprint: generateFingerprint(),
      }, {
        withCredentials: true,
        timeout: 10000,
      });

      if (response.data.tokens.access) {
        setAccessToken(response.data.tokens.access);
      }

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    // Client-side rate limiting
    const clientKey = `register_${payload.email}`;
    if (!rateLimiter.isAllowed(clientKey, 3, 60 * 60 * 1000)) { // 3 attempts per hour
      throw new Error('Too many registration attempts. Please try again later.');
    }

    // Input validation
    validateInput(payload);

    if (!payload.email || !payload.password) {
      throw new Error('Email and password are required');
    }

    if (!payload.first_name || !payload.last_name) {
      throw new Error('First name and last name are required');
    }

    if (payload.password.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }

    // Password strength check
    const strengthCheck = this.checkPasswordStrength(payload.password);
    if (strengthCheck.score < 3) {
      throw new Error('Password is too weak. Please choose a stronger password.');
    }

    try {
      const response = await apiClient.post<AuthResponse>('/register/', {
        ...payload,
        fingerprint: generateFingerprint(),
      }, {
        withCredentials: true,
        timeout: 15000,
      });

      if (response.data.tokens.access) {
        setAccessToken(response.data.tokens.access);
      }

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/logout/', {}, {
        withCredentials: true,
        timeout: 5000,
      });
    } catch (error) {
      // Log error but don't throw - we want to clear local state regardless
      // eslint-disable-next-line no-console
      console.warn('Logout request failed:', error);
    } finally {
      setAccessToken(null);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>('/me/', {
        withCredentials: true,
        timeout: 8000,
      });
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      if (apiError.response?.status === 401) {
        setAccessToken(null);
        return null;
      }
      return handleApiError(error);
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    validateInput(updates);

    try {
      const response = await apiClient.patch<User>('/me/', updates, {
        withCredentials: true,
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async changePassword(payload: PasswordChangeRequest): Promise<void> {
    validateInput(payload);

    if (!payload.current_password || !payload.new_password) {
      throw new Error('Current password and new password are required');
    }

    if (payload.new_password.length < 12) {
      throw new Error('New password must be at least 12 characters');
    }

    if (payload.new_password === payload.current_password) {
      throw new Error('New password must be different from current password');
    }

    // Password strength check
    const strengthCheck = this.checkPasswordStrength(payload.new_password);
    if (strengthCheck.score < 3) {
      throw new Error('New password is too weak. Please choose a stronger password.');
    }

    try {
      await apiClient.post('/change-password/', payload, {
        withCredentials: true,
        timeout: 10000,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getUserSessions(): Promise<UserSession[]> {
    try {
      const response = await apiClient.get<UserSession[]>('/sessions/', {
        withCredentials: true,
        timeout: 8000,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async terminateSession(sessionId: string): Promise<void> {
    try {
      await apiClient.delete(`/sessions/${sessionId}/`, {
        withCredentials: true,
        timeout: 8000,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getSecurityLogs(): Promise<SecurityLog[]> {
    try {
      const response = await apiClient.get<SecurityLog[]>('/security-logs/', {
        withCredentials: true,
        timeout: 8000,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async checkGeographicAccess(): Promise<GeographicAccess> {
    try {
      const response = await rootClient.get<GeographicAccess>('/auth/geo-check/', {
        withCredentials: true,
        timeout: 5000,
      });
      return response.data;
    } catch {
      return {
        canUseBankID: false,
        message: 'Geographic check failed'
      };
    }
  },

  async bankidStart(): Promise<BankIDStartResponse> {
    const geo = await this.checkGeographicAccess();

    if (!geo.canUseBankID) {
      throw new Error(geo.message ?? 'BankID not available in your region');
    }

    try {
      const response = await rootClient.post<BankIDStartResponse>(
        '/auth/bankid/start/',
        { fingerprint: generateFingerprint() },
        {
          withCredentials: true,
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async bankidStatus(orderRef: string): Promise<BankIDStatusResponse> {
    if (!orderRef) {
      throw new Error('Order reference is required');
    }

    try {
      const response = await rootClient.get<BankIDStatusResponse>(
        `/auth/bankid/status/${encodeURIComponent(orderRef)}/`,
        {
          withCredentials: true,
          timeout: 8000,
        }
      );

      if (response.data.tokens?.access) {
        setAccessToken(response.data.tokens.access);
      }

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async bankidCancel(orderRef: string): Promise<void> {
    if (!orderRef) {
      throw new Error('Order reference is required');
    }

    try {
      await rootClient.post(
        `/auth/bankid/cancel/${encodeURIComponent(orderRef)}/`,
        {},
        {
          withCredentials: true,
          timeout: 5000,
        }
      );
    } catch (error) {
      // Don't throw on cancel errors
      // eslint-disable-next-line no-console
      console.warn('BankID cancel failed:', error);
    }
  },

  // Password strength checker
  checkPasswordStrength(password: string): { score: number; feedback: string[] } {
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

    // Check for common patterns
    if (/(.)\1{3,}/.test(password)) {
      score--;
      feedback.push('Avoid repeated characters');
    }

    if (/123|abc|qwe|password/i.test(password)) {
      score--;
      feedback.push('Avoid common patterns');
    }

    return { score: Math.max(0, score), feedback };
  },

  // Email verification
  async requestEmailVerification(): Promise<void> {
    try {
      await apiClient.post('/verify-email/request/', {}, {
        withCredentials: true,
        timeout: 8000,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  async verifyEmail(token: string): Promise<void> {
    if (!token) {
      throw new Error('Verification token is required');
    }

    try {
      await apiClient.post('/verify-email/confirm/', { token }, {
        withCredentials: true,
        timeout: 8000,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Password reset
  async requestPasswordReset(email: string): Promise<void> {
    if (!email) {
      throw new Error('Email is required');
    }

    validateInput({ email });

    try {
      await apiClient.post('/password-reset/request/', { email }, {
        timeout: 8000,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    if (newPassword.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }

    const strengthCheck = this.checkPasswordStrength(newPassword);
    if (strengthCheck.score < 3) {
      throw new Error('Password is too weak. Please choose a stronger password.');
    }

    try {
      await apiClient.post('/password-reset/confirm/', {
        token,
        new_password: newPassword,
      }, {
        timeout: 10000,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
};
