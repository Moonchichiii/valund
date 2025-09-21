import {
  useAuthStatus as baseUseAuthStatus,
  useUser as baseUseUser,
  useLogin as baseUseLogin,
  useRegister as baseUseRegister,
  useLogout as baseUseLogout,
  useBankIDAuth as baseUseBankIDAuth,
  useGeographicAccess as baseUseGeo,
} from '../../../shared/hooks/useAuth'

export const useAuthStatus = baseUseAuthStatus
export const useUser = baseUseUser
export const useLogin = baseUseLogin
export const useRegister = baseUseRegister
export const useLogout = baseUseLogout
export const useBankIDAuth = baseUseBankIDAuth
export const useGeographicAccess = baseUseGeo
export const useAuth = () => { const s = baseUseAuthStatus(); const u = baseUseUser(); return { ...s, user: u.data } }
