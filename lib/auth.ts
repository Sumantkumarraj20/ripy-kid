// lib/auth.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AuthError } from "@/types/auth";
import { supabase } from "./supabaseClient";

/* Minimal runtime error class */
class AuthServiceError extends Error implements Partial<AuthError> {
  code: string;
  originalError?: any;

  constructor(message: string, code = "AUTH_ERROR", originalError?: any) {
    super(message);
    this.name = "AuthServiceError";
    this.code = code;
    this.originalError = originalError;
  }
}

/* Helper: call JSON API and normalize errors */
async function callApi<T = any>(path: string, payload: any): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });

  let data: any;
  try {
    data = await res.json();
  } catch (err) {
    if (!res.ok)
      throw new AuthServiceError(
        "Authentication server error",
        "AUTH_API_ERROR",
        err
      );
    return {} as T;
  }

  if (!res.ok) {
    const errMsg = data?.error ?? data?.message ?? "Authentication failed";
    const errCode = data?.code ?? "AUTH_API_ERROR";
    throw new AuthServiceError(errMsg, errCode, data);
  }

  return data as T;
}

/* Map/normalize common error messages to stable codes */
function mapError(error: any) {
  const text = (error?.message ?? String(error ?? "")).toString();

  if (text.includes("User already registered")) {
    return { code: "USER_EXISTS", message: "An account with this email already exists." };
  }
  if (text.includes("Password should be at least") || text.includes("Password must be at least")) {
    return { code: "WEAK_PASSWORD", message: "Password must meet the minimum requirements." };
  }
  if (text.includes("Invalid email")) {
    return { code: "INVALID_EMAIL", message: "Please enter a valid email address." };
  }
  if (text.includes("Email rate limit exceeded") || text.includes("Rate limit")) {
    return { code: "RATE_LIMITED", message: "Too many attempts. Please try again later." };
  }
  return { code: "AUTH_ERROR", message: error?.message ?? "Authentication failed" };
}

export default class AuthService {
  /**
   * Sign up -> calls POST /api/auth/signup
   * Returns the API response with user info and verification status
   */
  static async signUp(
    email: string,
    password: string,
    fullName?: string,
    dob?: string,
    role?: string
  ) {
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        fullName: fullName?.trim(),
        dob,
        role,
      };
      return await callApi("/api/auth/signup", payload);
    } catch (err: any) {
      if (err instanceof AuthServiceError) throw err;
      const mapped = mapError(err);
      throw new AuthServiceError(mapped.message, mapped.code, err);
    }
  }

  /**
   * Sign in -> calls POST /api/auth/signin
   */
  static async signIn(email: string, password: string) {
    try {
      return await callApi("/api/auth/signin", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
    } catch (err: any) {
      if (err instanceof AuthServiceError) throw err;
      const mapped = mapError(err);
      throw new AuthServiceError(mapped.message, mapped.code, err);
    }
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle(redirectTo?: string) {
    try {
      const data = await callApi<{ success: boolean; url: string }>("/api/auth/signin/google", {
        redirectTo,
      });

      if (data.url) {
        window.location.href = data.url;
        return new Promise(() => {}); // never resolves
      }

      throw new AuthServiceError("No OAuth URL received", "OAUTH_URL_MISSING");
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("play()")) return;
      if (err instanceof AuthServiceError) throw err;
      const mapped = mapError(err);
      throw new AuthServiceError(mapped.message, mapped.code, err);
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string) {
    try {
      return await callApi("/api/auth/resend-verification", { email: email.trim().toLowerCase() });
    } catch (err: any) {
      if (err instanceof AuthServiceError) throw err;
      const mapped = mapError(err);
      throw new AuthServiceError(mapped.message, mapped.code, err);
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    try {
      return await callApi("/api/auth/reset-password", { email: email.trim().toLowerCase() });
    } catch (err: any) {
      if (err instanceof AuthServiceError) throw err;
      const mapped = mapError(err);
      throw new AuthServiceError(mapped.message, mapped.code, err);
    }
  }

  /**
   * Update password (authenticated)
   */
  static async updatePassword(newPassword: string) {
    try {
      return await callApi("/api/auth/update-password", { newPassword: newPassword.trim() });
    } catch (err: any) {
      if (err instanceof AuthServiceError) throw err;
      const mapped = mapError(err);
      throw new AuthServiceError(mapped.message, mapped.code, err);
    }
  }

  /**
   * Handle Supabase auth callback
   */
  static async handleAuthCallback() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session) throw new Error("No session found");
      return { session, user: session.user };
    } catch (err: any) {
      const mapped = mapError(err);
      throw new AuthServiceError(mapped.message, mapped.code, err);
    }
  }
}

/* Named exports for backward compatibility */
export const signUp = AuthService.signUp;
export const signIn = AuthService.signIn;
export const signInWithGoogle = AuthService.signInWithGoogle;
export const resendVerificationEmail = AuthService.resendVerificationEmail;
export const resetPassword = AuthService.resetPassword;
export const updatePassword = AuthService.updatePassword;

export { AuthServiceError };
