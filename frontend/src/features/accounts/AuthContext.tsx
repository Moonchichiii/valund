import React, { createContext, useContext, useState, useCallback } from 'react';
import { api, setAccessToken } from './client';

interface Tokens {
  access: string;
  refresh: string;
}

interface BankidSession {
  order_ref: string;
  auto_start_token?: string;
}

interface AuthContextShape {
  tokens: Tokens | null;
  bankidSession: BankidSession | null;
  loading: boolean;
  error: string | null;
  oauthExchange: (provider: 'google' | 'github', code: string) => Promise<void>;
  bankidStart: (personalNumber?: string) => Promise<void>;
  bankidPoll: () => Promise<string | null>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [bankidSession, setBankidSession] = useState<BankidSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const oauthExchange = useCallback(async (provider: 'google' | 'github', code: string) => {
    setError(null); setLoading(true);
    try {
      const resp = await api.post('/auth/oauth/exchange/', { provider, code });
      setTokens(resp.data.tokens);
      setAccessToken(resp.data.tokens.access);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'OAuth exchange failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const bankidStart = useCallback(async (personalNumber?: string) => {
    setError(null); setLoading(true);
    try {
      const resp = await api.post('/auth/bankid/start/', personalNumber ? { personal_number: personalNumber } : {});
      setBankidSession({ order_ref: resp.data.order_ref, auto_start_token: resp.data.auto_start_token });
    } catch (e: any) {
      setError(e.response?.data?.detail || 'BankID start failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const bankidPoll = useCallback(async () => {
    if (!bankidSession) return null;
    setLoading(true);
    try {
      const resp = await api.get(`/auth/bankid/status/${bankidSession.order_ref}/`);
      if (resp.data.status === 'complete' && resp.data.tokens) {
        setTokens(resp.data.tokens);
        setAccessToken(resp.data.tokens.access);
      }
      return resp.data.status;
    } catch (e: any) {
      setError(e.response?.data?.detail || 'BankID poll failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [bankidSession]);

  const logout = useCallback(() => {
    setTokens(null);
    setBankidSession(null);
    setAccessToken(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ tokens, bankidSession, loading, error, oauthExchange, bankidStart, bankidPoll, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
