import { apiClient, rootClient, setAccessToken } from './client';
import type {
  AuthResponse,
  BankIDStartResponse,
  BankIDStatusResponse,
  GeographicAccess,
  LoginRequest,
  RegisterRequest,
  User,
} from '../features/accounts/types/auth';

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login/', payload, {
      withCredentials: true
    });

    if (response.data.tokens.access) {
      setAccessToken(response.data.tokens.access);
    }

    return response.data;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register/', payload, {
      withCredentials: true
    });

    if (response.data.tokens.access) {
      setAccessToken(response.data.tokens.access);
    }

    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout/', null, { withCredentials: true });
    } finally {
      setAccessToken(null);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>('/auth/me/', { withCredentials: true });
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number } };
        if (axiosError.response.status === 401) {
          return null;
        }
      }
      throw error;
    }
  },

  async checkGeographicAccess(): Promise<GeographicAccess> {
    try {
      const response = await rootClient.get<GeographicAccess>('/auth/geo-check/', {
        withCredentials: true
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
      throw new Error(geo.message || 'BankID not available in your region');
    }

    const response = await rootClient.post<BankIDStartResponse>(
      '/auth/bankid/start/',
      {},
      { withCredentials: true }
    );

    return response.data;
  },

  async bankidStatus(orderRef: string): Promise<BankIDStatusResponse> {
    const response = await rootClient.get<BankIDStatusResponse>(
      `/auth/bankid/status/${encodeURIComponent(orderRef)}/`,
      { withCredentials: true }
    );

    if (response.data.tokens && response.data.tokens.access) {
      setAccessToken(response.data.tokens.access);
    }

    return response.data;
  },

  async bankidCancel(orderRef: string): Promise<void> {
    await rootClient.post(
      `/auth/bankid/cancel/${encodeURIComponent(orderRef)}/`,
      {},
      { withCredentials: true }
    );
  },
};
