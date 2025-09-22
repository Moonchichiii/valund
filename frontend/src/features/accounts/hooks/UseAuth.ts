import {
  useAuthStatus as baseUseAuthStatus,
  useBankIDAuth as baseUseBankIDAuth,
  useGeographicAccess as baseUseGeo,
  useLogin as baseUseLogin,
  useLogout as baseUseLogout,
  useRegister as baseUseRegister,
  useUser as baseUseUser,
} from '../../../shared/hooks/useAuth'

export const useAuthStatus = baseUseAuthStatus
export const useUser = baseUseUser
export const useLogin = baseUseLogin
export const useRegister = baseUseRegister
export const useLogout = baseUseLogout
export const useBankIDAuth = baseUseBankIDAuth
export const useGeographicAccess = baseUseGeo
export const useAuth = () => { const s = baseUseAuthStatus(); const u = baseUseUser(); return { ...s, user: u.data } }
