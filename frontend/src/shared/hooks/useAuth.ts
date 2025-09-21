import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { toast } from 'react-hot-toast'
import type { User } from '../types/auth'

export const useUser = () =>
  useQuery<User | null>({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 3 * 60 * 1000,
  })

export const useAuthStatus = () => {
  const q = useUser()
  return { isAuthenticated: !!q.data, isLoading: q.isLoading, user: q.data }
}

export const useLogin = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Signed in')
    },
    onError: () => toast.error('Invalid email or password'),
  })
}

export const useRegister = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Account created')
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Registration failed'),
  })
}

export const useLogout = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['auth'] })
      await qc.clear()
      toast.success('Signed out')
    },
  })
}

export const useGeographicAccess = () =>
  useQuery({
    queryKey: ['auth', 'geographic-access'],
    queryFn: authApi.checkGeographicAccess,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

export const useBankIDAuth = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const start = await authApi.bankidStart()
      let tries = 0
      while (tries++ < 60) {
        await new Promise((r) => setTimeout(r, 2000))
        const res = await authApi.bankidStatus(start.order_ref)
        if (res.status === 'complete' && res.user) {
          await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
          return res.user
        }
        if (res.status === 'failed') throw new Error('BankID failed')
      }
      throw new Error('BankID timeout')
    },
    onSuccess: () => toast.success('Signed in with BankID'),
    onError: (err: any) => {
      const msg = String(err?.message || '')
      if (msg.toLowerCase().includes('region') || msg.toLowerCase().includes('bankid')) {
        toast.error('BankID is only available from Swedish IP addresses')
      } else {
        toast.error('Unable to complete BankID login')
      }
    },
  })
}
