export interface User {
  id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface AuthResponse {
  user: User;
  tokens: Tokens;
}

// Geographic access (from identity app)
export interface GeographicAccess {
  canUseBankID: boolean;
  message?: string;
}

// BankID interfaces (from identity app)
export interface BankIDStartResponse {
  order_ref: string;
  qr_start_token?: string;
  qr_start_secret?: string;
  auto_start_token?: string;
}

export interface BankIDStatusResponse {
  order_ref: string;
  status: 'pending' | 'failed' | 'complete';
  hint_code?: string;
  user?: User;
  tokens?: Tokens;
}
