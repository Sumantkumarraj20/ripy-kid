// types/auth.ts
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  full_name?: string;
  dob?: string;
  role?: string;
  confirmPassword?: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface SignUpResult {
  user: AuthUser;
  session?: AuthSession;
  needsEmailVerification: boolean;
}

export interface SignInResult {
  user: AuthUser;
  session?: AuthSession;
  emailVerified: boolean;
}

export interface GoogleSignInResult {
  success: boolean;
}

export interface ResetPasswordResult {
  success: boolean;
}

export interface UpdatePasswordResult {
  success: boolean;
}
