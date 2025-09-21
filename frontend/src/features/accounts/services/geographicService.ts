import { authApi } from '../../../api/auth'
import type { GeographicAccess } from '../types/auth'
export const geographicService = {
  checkAccess: (): Promise<GeographicAccess> => authApi.checkGeographicAccess(),
  isSwedishIP: async (): Promise<boolean> => { const a = await authApi.checkGeographicAccess(); return a.canUseBankID },
}
