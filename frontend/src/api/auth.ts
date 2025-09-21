import { apiClient, rootClient, handleApiError, setAccessToken } from './client';

// Types for auth domain
export type User = {
  id: number;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
};

export type Tokens = {
  access: string;
  refresh?: string;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type RegisterData = {
  email: string;
  password: string;
  username?: string;
};

export type OAuthProvider = 'google' | 'github';

export type OAuthExchangeData = {
  provider: OAuthProvider;
  code: string;
};

export type BankIDStartData = {
  personal_number?: string;
};

// Local storage helpers for user persistence (until backend exposes /me)
const USER_STORAGE_KEY = 'authUser';

export function setAuthUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function getAuthUser(): User | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

// Concrete API calls
async function login(data: LoginCredentials): Promise<{ tokens: Tokens; user?: User }> {
  try {
  // Django SimpleJWT lives under /api/auth/login/
  const res = await apiClient.post('/auth/login/', data);
    const tokens = res.data as Tokens | { access: string; refresh?: string };
    if ('access' in tokens) {
      setAccessToken(tokens.access);
    }
    // No user info from this endpoint by default
    return { tokens: tokens as Tokens };
  } catch (err) {
    throw new Error(handleApiError(err));
  }
}

async function register(_: RegisterData): Promise<{ tokens?: Tokens; user?: User }> {
  // Not implemented server-side yet
  throw new Error('Registration is not supported yet');
}

async function logout(): Promise<void> {
  // Server logout not implemented; clear local state
  setAccessToken(null);
  setAuthUser(null);
}

async function oauthExchange(payload: OAuthExchangeData): Promise<{ tokens: Tokens; user: User }> {
  try {
  // Identity OAuth endpoints live under root /auth
  const res = await rootClient.post('/auth/oauth/exchange/', payload);
    const { tokens, user } = res.data as { tokens: Tokens; user: User };
    if (tokens?.access) setAccessToken(tokens.access);
    setAuthUser(user);
    return { tokens, user };
  } catch (err) {
    throw new Error(handleApiError(err));
  }
}

async function bankidStart(data?: BankIDStartData): Promise<{ order_ref: string; auto_start_token?: string }> {
  try {
  const res = await rootClient.post('/auth/bankid/start/', data ?? {});
    return res.data as { order_ref: string; auto_start_token?: string };
  } catch (err) {
    throw new Error(handleApiError(err));
  }
}

async function bankidStatus(orderRef: string): Promise<
  | { status: 'pending' }
  | { status: 'complete'; tokens: Tokens; user: User }
  | { status: 'failed' | 'cancelled' }
> {
  try {
  const res = await rootClient.get(`/auth/bankid/status/${encodeURIComponent(orderRef)}/`);
    const data = res.data as any;
    if (data?.status === 'complete' && data.tokens?.access && data.user) {
      setAccessToken(data.tokens.access);
      setAuthUser(data.user);
    }
    return data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
}

async function bankidCancel(orderRef: string): Promise<void> {
  try {
  await rootClient.post(`/auth/bankid/cancel/${encodeURIComponent(orderRef)}/`);
  } catch (err) {
    throw new Error(handleApiError(err));
  }
}

async function getCurrentUser(): Promise<User | null> {
  // Until backend exposes /me, rely on cached user in localStorage
  return getAuthUser();
}

export const authApi = {
  login,
  register,
  logout,
  oauthExchange,
  bankidStart,
  bankidStatus,
  bankidCancel,
  getCurrentUser,
};
