import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type {
  AuthResponse,
  GeographicAccess,
  LoginRequest,
  PasswordChangeRequest,
  RegisterRequest,
  SecurityLog,
  User,
  UserSession,
} from "@/features/accounts/types/auth";

const rawApiUrl = (import.meta.env as Record<string, unknown>).VITE_API_URL;
const API_ORIGIN: string = (typeof rawApiUrl === "string" ? rawApiUrl : "http://localhost:8000").replace(/\/+$/, "");

const authClient = axios.create({
  baseURL: `${API_ORIGIN}/api/auth/`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

let ACCESS_TOKEN: string | null = null;
export const setAccessToken = (token: string | null): void => {
  ACCESS_TOKEN = token;
};
export const getAccessToken = (): string | null => ACCESS_TOKEN;

authClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (ACCESS_TOKEN) {
    (config.headers as Record<string, string>).Authorization = `Bearer ${ACCESS_TOKEN}`;
  }
  return config;
});

const primeCsrf = async (): Promise<void> => {
  try {
    await authClient.get("csrf/");
  } catch {
    return;
  }
};

const getCsrfTokenFromCookie = (): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split("; csrftoken=");
  if (parts.length !== 2) return null;
  const last = parts.pop();
  if (!last) return null;
  const token = last.split(";").shift();
  return token ?? null;
};

let isRefreshing = false;
let waiters: ((access: string) => void)[] = [];

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

authClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as RetriableRequestConfig | undefined;
    if (status !== 401 || !original || original._retry || original.url?.endsWith("refresh/")) {
      throw error;
    }
    original._retry = true;
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        await primeCsrf();
        const { data } = await authClient.post<{ access: string }>("refresh/");
        setAccessToken(data.access);
        waiters.forEach((resolve) => { resolve(data.access); });
        waiters = [];
      } catch (_err) {
        setAccessToken(null);
        waiters = [];
        isRefreshing = false;
        throw error;
      }
      isRefreshing = false;
      const accessToken = getAccessToken();
      if (accessToken) {
        (original.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
      }
      return authClient(original);
    }
    return new Promise((resolve, reject) => {
      waiters.push((access) => {
        try {
          (original.headers as Record<string, string>).Authorization = `Bearer ${access}`;
          resolve(authClient(original));
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    });
  }
);

interface ApiErrorData {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}
type ApiError = AxiosError<ApiErrorData>;

const handleError = (error: unknown): never => {
  if (axios.isAxiosError<ApiErrorData>(error)) {
    const response = error.response;
    if (response?.status === 401) {
      setAccessToken(null);
      throw new Error("Authentication failed. Please sign in again.");
    }
    if (response?.status === 403) {
      const detail = response ? (response.data.detail ?? "") : "";
      if (detail.toLowerCase().includes("csrf") || detail.toLowerCase().includes("forbidden")) {
        throw new Error("Security token expired. Please try again.");
      }
      throw new Error("Access forbidden. Please check your permissions.");
    }
    const errorsObj = response?.data.errors;
    if (errorsObj) {
      const first = Object.values(errorsObj)[0];
      throw new Error(Array.isArray(first) ? first[0] : "Validation error");
    }
    let msgFromResponse: string | undefined;
    if (response) {
      msgFromResponse = response.data.detail ?? response.data.message;
    }
    const msg = msgFromResponse ?? error.message;
    throw new Error(msg);
  }
  throw new Error(error instanceof Error ? error.message : "An unexpected error occurred");
};

const withCsrfRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    const err = e as AxiosError<ApiErrorData>;
    const csrfDetail = err.response?.data.detail?.toLowerCase();
    const statusText = err.response ? err.response.statusText.toLowerCase() : "";
    const hasCsrfInDetail = !!csrfDetail && csrfDetail.includes("csrf");
    const hasForbiddenInStatus = statusText.includes("forbidden");
    const isCsrf403 =
      axios.isAxiosError(err) &&
      err.response?.status === 403 &&
      (hasCsrfInDetail || hasForbiddenInStatus);
    if (isCsrf403) {
      await primeCsrf();
      return await fn();
    }
    return handleError(e);
  }
};

class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();
  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    if (record.count >= maxAttempts) return false;
    record.count++;
    return true;
  }
}
const rateLimiter = new RateLimiter();

export const authApi = {
  async getCsrfToken(): Promise<string | null> {
    await primeCsrf();
    return getCsrfTokenFromCookie();
  },

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const key = `login_${payload.email}`;
    if (!rateLimiter.isAllowed(key, 5, 15 * 60 * 1000)) {
      throw new Error("Too many login attempts. Try again in 15 minutes.");
    }
    await primeCsrf();
    return withCsrfRetry(async () => {
      const res = await authClient.post<AuthResponse>("login/", payload);
      const { tokens } = res.data;
      if (tokens?.access) setAccessToken(tokens.access);
      return res.data;
    });
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    await primeCsrf();
    return withCsrfRetry(async () => {
      const res = await authClient.post<AuthResponse>("register/", payload);
      const { tokens } = res.data;
      if (tokens?.access) setAccessToken(tokens.access);
      return res.data;
    });
  },

  async logout(): Promise<void> {
    try {
      await withCsrfRetry(async () => authClient.post("logout/"));
    } catch {
      return;
    } finally {
      setAccessToken(null);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await authClient.get<User>("me/");
      return res.data;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.response?.status === 401) {
        setAccessToken(null);
        return null;
      }
      return handleError(error);
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    return withCsrfRetry(async () => {
      const res = await authClient.patch<User>("me/", updates);
      return res.data;
    });
  },

  async changePassword(payload: PasswordChangeRequest): Promise<void> {
    return withCsrfRetry(async () => {
      await authClient.post("change-password/", payload);
    });
  },

  async getUserSessions(): Promise<UserSession[]> {
    try {
      const res = await authClient.get<UserSession[]>("sessions/");
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async terminateSession(sessionId: string): Promise<void> {
    return withCsrfRetry(async () => {
      await authClient.delete(`sessions/${encodeURIComponent(sessionId)}/`);
    });
  },

  async getSecurityLogs(): Promise<SecurityLog[]> {
    try {
      const res = await authClient.get<SecurityLog[]>("security-logs/");
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async checkGeographicAccess(): Promise<GeographicAccess> {
    try {
      const res = await authClient.get<GeographicAccess>("geo-check/");
      return res.data;
    } catch {
      return { canUseBankID: false, message: "Geographic access check unavailable" };
    }
  },

  async bankidStart(): Promise<{ order_ref: string; auto_start_token?: string }> {
    return withCsrfRetry(async () => {
      const res = await authClient.post<{ order_ref: string; auto_start_token?: string }>(
        "bankid/start/",
        {}
      );
      return res.data;
    });
  },

  async bankidStatus(orderRef: string): Promise<{
    order_ref: string;
    status: "pending" | "failed" | "complete";
    user?: User;
    tokens?: { access: string; refresh: string };
  }> {
    const res = await authClient.get<{
      order_ref: string;
      status: "pending" | "failed" | "complete";
      user?: User;
      tokens?: { access: string; refresh: string };
    }>(`bankid/status/${encodeURIComponent(orderRef)}/`);
    return res.data;
  },

  async bankidCancel(orderRef: string): Promise<void> {
    try {
      await withCsrfRetry(async () =>
        authClient.post(`bankid/cancel/${encodeURIComponent(orderRef)}/`, {})
      );
    } catch {
      return;
    }
  },

  checkPasswordStrength(password: string): { score: number; feedback: string[] } {
    let score = 0;
    const feedback: string[] = [];
    if (password.length >= 12) score++; else feedback.push("Use at least 12 characters");
    if (/[a-z]/.test(password)) score++; else feedback.push("Add lowercase letters");
    if (/[A-Z]/.test(password)) score++; else feedback.push("Add uppercase letters");
    if (/\d/.test(password)) score++; else feedback.push("Add numbers");
    if (/[^a-zA-Z0-9]/.test(password)) score++; else feedback.push("Add special characters");
    return { score: Math.max(0, score), feedback };
  },
};
