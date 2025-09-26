export interface User {
  id: number; // keep number unless your backend uses UUIDs
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  user_type?: 'freelancer' | 'client' | 'admin';
  phone_number?: string;
  is_verified?: boolean;
  account_status?: 'active' | 'suspended' | 'deactivated' | 'pending';
  account_status_display?: string;
  user_type_display?: string;
  two_factor_enabled?: boolean;
  created_at?: string;
  last_activity?: string;
  marketing_consent?: boolean;
  analytics_consent?: boolean;
  full_name?: string;
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
  password_confirm?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  user_type?: 'freelancer' | 'client';
  phone_number?: string;
  terms_accepted?: boolean;
  privacy_policy_accepted?: boolean;
  marketing_consent?: boolean;
  analytics_consent?: boolean;
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

// BankID (from identity app)
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

// Additional auth system types
export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  new_password_confirm?: string;
}

export interface UserSession {
  id: number;                // <-- number (Django pk)
  ip_address: string;
  location: string;
  created_at: string;
  last_activity: string;
  is_current: boolean;       // <-- rename to match backend
  device_info?: {
    browser?: string;
    os?: string;
    device_type?: string;
    is_bot?: boolean;
  };
}

export interface SecurityLog {
  id: string;
  user_email?: string;
  event_type: string;
  event_type_display: string;
  ip_address: string;
  timestamp: string;
  details: Record<string, unknown>;
}
