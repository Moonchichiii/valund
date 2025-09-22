import { apiClient, rootClient, setAccessToken } from './client'
import type { BankIDStartResponse, GeographicAccess, Tokens, User } from '../features/accounts/types/auth'

export const authApi = {
  async login(payload: { email: string; password: string }): Promise<{ tokens: Tokens; user: User }> {
    const { data } = await apiClient.post('/auth/login/', payload, { withCredentials: true })
    if (data?.tokens?.access) setAccessToken(data.tokens.access)
    return data
  },

  async register(payload: { email: string; password: string; first_name?: string; last_name?: string }): Promise<{ tokens: Tokens; user: User }> {
    const { data } = await apiClient.post('/auth/register/', payload, { withCredentials: true })
    if (data?.tokens?.access) setAccessToken(data.tokens.access)
    return data
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout/', null, { withCredentials: true })
    } finally {
      setAccessToken(null)
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data } = await apiClient.get('/auth/me/', { withCredentials: true })
      return data
    } catch (e: any) {
      if (e?.response?.status === 401) return null
      throw e
    }
  },

  async checkGeographicAccess(): Promise<GeographicAccess> {
    try {
      const { data } = await rootClient.get('/auth/geo-check/', { withCredentials: true })
      return data
    } catch {
      return { canUseBankID: false, message: 'Geographic check failed' }
    }
  },

  async bankidStart(): Promise<BankIDStartResponse> {
    const geo = await this.checkGeographicAccess()
    if (!geo.canUseBankID) throw new Error(geo.message || 'BankID not available in your region')
    const { data } = await rootClient.post('/auth/bankid/start/', {}, { withCredentials: true })
    return data
  },

  async bankidStatus(order_ref: string): Promise<{ status: string; tokens?: Tokens; user?: User }> {
    const { data } = await rootClient.get(`/auth/bankid/status/${encodeURIComponent(order_ref)}/`, { withCredentials: true })
    if (data?.tokens?.access) setAccessToken(data.tokens.access)
    return data
  },

  async bankidCancel(order_ref: string): Promise<void> {
    await rootClient.post(`/auth/bankid/cancel/${encodeURIComponent(order_ref)}/`, {}, { withCredentials: true })
  },
}
