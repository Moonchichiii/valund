export interface User { id: number | string; email: string; username?: string; first_name?: string; last_name?: string }
export interface Tokens { access: string; refresh?: string }
export interface GeographicAccess { canUseBankID: boolean; country?: string; message?: string }
export interface BankIDStartResponse { order_ref: string; auto_start_token?: string; qr_start_token?: string; qr_start_secret?: string }
