"use client";

import { useState, useEffect, useCallback, JSX } from "react";
import AuthService from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthFormData } from "@/types/auth";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiShield,
  FiCalendar,
  FiUsers,
  FiBook,
  FiHeart,
  FiStar,
} from "react-icons/fi";

type AuthMode = "signin" | "signup";
type UserRole =
  | "kid"
  | "parent"
  | "guardian"
  | "teacher"
  | "caregiver"
  | "healthcare_provider";

interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
  confirmPassword?: string;
  dob?: string;
  role?: string;
}

interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
  icon: JSX.Element;
  minAge?: number;
  maxAge?: number;
}

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    full_name: "",
    confirmPassword: "",
    dob: "",
    role: "parent",
  });
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [redirectPath, setRedirectPath] = useState("/");
  const [authError, setAuthError] = useState<{
    message: string;
    code?: string;
    needsVerification?: boolean;
  } | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

  // Role options configuration
  const roleOptions: RoleOption[] = [
    {
      value: "kid",
      label: "Student/Kid",
      description: "For children under 16 years old",
      icon: <FiUsers className="w-5 h-5" />,
      maxAge: 15,
    },
    {
      value: "parent",
      label: "Parent",
      description: "For parents managing their children",
      icon: <FiHeart className="w-5 h-5" />,
      minAge: 16,
    },
    {
      value: "guardian",
      label: "Guardian",
      description: "For legal guardians of children",
      icon: <FiShield className="w-5 h-5" />,
      minAge: 18,
    },
    {
      value: "teacher",
      label: "Teacher",
      description: "For educators and teachers",
      icon: <FiBook className="w-5 h-5" />,
      minAge: 18,
    },
    {
      value: "caregiver",
      label: "Caregiver",
      description: "For professional caregivers",
      icon: <FiHeart className="w-5 h-5" />,
      minAge: 18,
    },
    {
      value: "healthcare_provider",
      label: "Healthcare Provider",
      description: "For medical and healthcare professionals",
      icon: <FiStar className="w-5 h-5" />,
      minAge: 21,
    },
  ];

  // Handle mode from query params
  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "signup" || modeParam === "signin") {
      setMode(modeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRedirect = urlParams.get("redirect");
    if (urlRedirect) {
      setRedirectPath(urlRedirect);
      return;
    }
    const storedRedirect = sessionStorage.getItem("auth_redirect");
    if (storedRedirect) setRedirectPath(storedRedirect);
  }, []);

  // Calculate age when DOB changes
  useEffect(() => {
    if (formData.dob) {
      const today = new Date();
      const birthDate = new Date(formData.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      setCalculatedAge(age);

      // Auto-select role based on age
      if (age < 16) {
        setFormData((prev) => ({ ...prev, role: "kid" }));
      } else {
        // Default to parent for adults
        setFormData((prev) => ({ ...prev, role: "parent" }));
      }
    }
  }, [formData.dob]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get("message");
    const error = urlParams.get("error");

    if (message === "email_verified") {
      setAuthError({
        message: "Email verified successfully! You can now sign in.",
        code: "EMAIL_VERIFIED",
      });
      // Clean up URL
      window.history.replaceState({}, "", "/auth");
    }

    if (error) {
      setAuthError({
        message: "Email verification failed. Please try again.",
        code: "VERIFICATION_FAILED",
      });
      window.history.replaceState({}, "", "/auth");
    }
  }, []);

  const calculatePasswordStrength = useCallback((password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return Math.min(strength, 100);
  }, []);

  const handlePasswordChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, password: value }));
      setPasswordStrength(calculatePasswordStrength(value));
    },
    [calculatePasswordStrength]
  );

  const getPasswordStrengthColor = useCallback(() => {
    if (passwordStrength < 25) return "bg-red-500";
    if (passwordStrength < 50) return "bg-orange-500";
    if (passwordStrength < 75) return "bg-yellow-500";
    return "bg-green-500";
  }, [passwordStrength]);

  const getPasswordStrengthIcon = useCallback(() => {
    if (passwordStrength < 25)
      return <FiAlertCircle className="text-red-500" />;
    if (passwordStrength < 50)
      return <FiAlertCircle className="text-orange-500" />;
    if (passwordStrength < 75) return <FiInfo className="text-yellow-500" />;
    return <FiCheckCircle className="text-green-500" />;
  }, [passwordStrength]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (mode === "signup") {
      if (!formData.full_name?.trim()) {
        newErrors.fullName = "Full name is required";
      }

      if (!formData.dob) {
        newErrors.dob = "Date of birth is required";
      } else if (calculatedAge !== null && calculatedAge < 0) {
        newErrors.dob = "Date of birth cannot be in the future";
      }

      if (!formData.role) {
        newErrors.role = "Please select a role";
      } else if (calculatedAge !== null) {
        const selectedRole = roleOptions.find(
          (role) => role.value === formData.role
        );
        if (selectedRole?.minAge && calculatedAge < selectedRole.minAge) {
          newErrors.role = `You must be at least ${selectedRole.minAge} years old for this role`;
        }
        if (selectedRole?.maxAge && calculatedAge > selectedRole.maxAge) {
          newErrors.role = `This role is only for users under ${
            selectedRole.maxAge + 1
          } years old`;
        }
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, mode, calculatedAge, roleOptions]);

  const handleResendVerification = useCallback(async () => {
    if (!formData.email) {
      setAuthError({
        message: "Please enter your email first",
        code: "EMAIL_REQUIRED",
      });
      return;
    }
    try {
      setResendDisabled(true);
      await AuthService.resendVerificationEmail(formData.email);
      setAuthError({
        message: "Verification email sent! Please check your inbox.",
        code: "VERIFICATION_SENT",
      });
      setTimeout(() => setResendDisabled(false), 60000);
    } catch (err: any) {
      console.error("Resend error:", err);
      setAuthError({
        message: "Could not resend verification email. Please try again.",
        code: "RESEND_FAILED",
      });
      setResendDisabled(false);
    }
  }, [formData.email]);

  const handleResetPassword = useCallback(async () => {
    if (!formData.email) {
      setAuthError({
        message: "Please enter your email first",
        code: "EMAIL_REQUIRED",
      });
      return;
    }
    try {
      await AuthService.resetPassword(formData.email);
      setAuthError({
        message: "Password reset email sent! Please check your inbox.",
        code: "RESET_SENT",
      });
    } catch (err: any) {
      console.error("Reset password error:", err);
      setAuthError({
        message: "Could not send reset email. Please try again.",
        code: "RESET_FAILED",
      });
    }
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await AuthService.signUp(
          formData.email,
          formData.password,
          formData.full_name,
          formData.dob,
          formData.role
        );

        if (result?.needsEmailVerification) {
          setAuthError({
            message:
              "Account created successfully! Please verify your email address to continue.",
            code: "EMAIL_NOT_VERIFIED",
            needsVerification: true,
          });
          setFormData((prev) => ({
            ...prev,
            password: "",
            confirmPassword: "",
          }));
          setLoading(false); // Add this to stop loading state
          return; // Add this to prevent further execution
        } else {
          router.push(redirectPath !== "/auth" ? redirectPath : "/");
        }
      } else {
        const signInResult = await AuthService.signIn(
          formData.email,
          formData.password
        );

        if (signInResult && signInResult.emailVerified === false) {
          setAuthError({
            message: "Please verify your email address before signing in.",
            code: "EMAIL_NOT_VERIFIED",
            needsVerification: true,
          });
          setLoading(false);
          return;
        }

        router.push(redirectPath !== "/auth" ? redirectPath : "/");
      }

      sessionStorage.removeItem("auth_redirect");
    } catch (err: any) {
      console.error("Auth error:", err);
      const message =
        err?.message || "Authentication failed. Please try again.";
      const code = err?.code || undefined;
      setAuthError({ message, code });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;

    setLoading(true);
    setAuthError(null);

    try {
      if (redirectPath && redirectPath !== "/auth") {
        sessionStorage.setItem("auth_redirect", redirectPath);
      }

      await AuthService.signInWithGoogle(redirectPath);

      setTimeout(() => {
        if (!window.closed && document.visibilityState === "visible") {
          setLoading(false);
          setAuthError({
            message: "Redirect taking too long. Please try again.",
            code: "REDIRECT_STALLED",
          });
        }
      }, 5000);
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("play()")) {
        return;
      }

      if (window.location.href !== window.location.origin + "/auth") {
        return;
      }

      setAuthError({
        message: err?.message || "Google sign-in failed. Please try again.",
        code: err?.code,
      });
      setLoading(false);
    }
  };

  const switchMode = useCallback((newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setPasswordStrength(0);
    setFormData((prev) => ({
      ...prev,
      password: "",
      confirmPassword: "",
      dob: "",
      role: "parent",
    }));
    setAuthError(null);
    setCalculatedAge(null);
  }, []);

  const updateFormField = useCallback(
    (field: keyof AuthFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (field === "email") setAuthError(null);
    },
    []
  );

  const getFilteredRoles = () => {
    return roleOptions.filter((role) => {
      if (calculatedAge === null) return true;
      if (role.minAge && calculatedAge < role.minAge) return false;
      if (role.maxAge && calculatedAge > role.maxAge) return false;
      return true;
    });
  };

  const openEmailClient = () => {
    window.open("https://mail.google.com", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card-elevated rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

          <div className="p-6 sm:p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white mx-auto">
                  {mode === "signup" ? (
                    <FiUser className="w-8 h-8" />
                  ) : (
                    <FiShield className="w-8 h-8" />
                  )}
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mode === "signup" ? "Create Your Account" : "Welcome Back"}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    {mode === "signup"
                      ? "Join our educational community"
                      : "Sign in to continue your journey"}
                  </p>
                </div>
              </div>

              {/* Success Verification Alert */}
              {authError?.needsVerification && (
                <div className="rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800 dark:text-green-300">
                        Check Your Email!
                      </h3>
                      <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                        We've sent a verification link to your email address.
                        Please verify your account to continue.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          onClick={openEmailClient}
                          className="btn btn-primary btn-sm flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <FiMail className="w-3 h-3" />
                          Open Email
                        </button>
                        <button
                          onClick={handleResendVerification}
                          disabled={resendDisabled}
                          className="btn btn-ghost btn-sm flex items-center gap-2 text-green-600 hover:text-green-700"
                        >
                          <FiMail className="w-3 h-3" />
                          Resend Email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Auth Error Alert */}
              {authError && !authError.needsVerification && (
                <div
                  className={`rounded-lg p-4 text-sm ${
                    authError.code === "EMAIL_NOT_VERIFIED"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                      : authError.code === "INVALID_CREDENTIALS"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {authError.code === "EMAIL_NOT_VERIFIED" ? (
                          <FiMail className="w-4 h-4" />
                        ) : authError.code === "INVALID_CREDENTIALS" ? (
                          <FiAlertCircle className="w-4 h-4" />
                        ) : (
                          <FiAlertCircle className="w-4 h-4" />
                        )}
                        {authError.code === "EMAIL_NOT_VERIFIED"
                          ? "Email verification required"
                          : authError.code === "INVALID_CREDENTIALS"
                          ? "Sign-in failed"
                          : "Error"}
                      </div>
                      <p className="mt-1">{authError.message}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {authError.code === "EMAIL_NOT_VERIFIED" && (
                          <>
                            <button
                              className="btn btn-primary btn-sm flex items-center gap-2"
                              onClick={handleResendVerification}
                              disabled={resendDisabled}
                            >
                              <FiMail className="w-3 h-3" />
                              Resend verification
                            </button>
                            <button
                              className="btn btn-ghost btn-sm flex items-center gap-2"
                              onClick={() => setAuthError(null)}
                            >
                              <FiUser className="w-3 h-3" />
                              Dismiss
                            </button>
                          </>
                        )}
                        {authError.code === "INVALID_CREDENTIALS" && (
                          <>
                            <button
                              className="btn btn-destructive btn-sm flex items-center gap-2"
                              onClick={handleResetPassword}
                            >
                              <FiLock className="w-3 h-3" />
                              Reset password
                            </button>
                            <button
                              className="btn btn-ghost btn-sm flex items-center gap-2"
                              onClick={() => setAuthError(null)}
                            >
                              <FiAlertCircle className="w-3 h-3" />
                              Dismiss
                            </button>
                          </>
                        )}
                        {![
                          "EMAIL_NOT_VERIFIED",
                          "INVALID_CREDENTIALS",
                        ].includes(authError.code || "") && (
                          <button
                            className="btn btn-ghost btn-sm flex items-center gap-2"
                            onClick={() => setAuthError(null)}
                          >
                            <FiAlertCircle className="w-3 h-3" />
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Field */}
                <div
                  className={`transition-all duration-300 ${
                    mode === "signup" ? "block" : "hidden"
                  }`}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.full_name || ""}
                      onChange={(e) =>
                        updateFormField("full_name", e.target.value)
                      }
                      className="input pl-10 w-full"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiUser className="w-4 h-4" />
                    </div>
                  </div>
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Date of Birth Field */}
                <div
                  className={`transition-all duration-300 ${
                    mode === "signup" ? "block" : "hidden"
                  }`}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth
                    {calculatedAge !== null && (
                      <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                        ({calculatedAge} years old)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.dob || ""}
                      onChange={(e) => updateFormField("dob", e.target.value)}
                      className="input pl-10 w-full"
                      max={new Date().toISOString().split("T")[0]}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiCalendar className="w-4 h-4" />
                    </div>
                  </div>
                  {errors.dob && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.dob}
                    </p>
                  )}
                </div>

                {/* Role Selection */}
                <div
                  className={`transition-all duration-300 ${
                    mode === "signup" && calculatedAge !== null
                      ? "block"
                      : "hidden"
                  }`}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Your Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getFilteredRoles().map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => updateFormField("role", role.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                          formData.role === role.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              formData.role === role.value
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {role.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {role.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {role.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.role && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.role}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => updateFormField("email", e.target.value)}
                      className="input pl-10 w-full"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiMail className="w-4 h-4" />
                    </div>
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="input pl-10 pr-10 w-full"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiLock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}

                  {/* Password Strength Indicator */}
                  {mode === "signup" && formData.password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Password strength</span>
                        <span className="flex items-center gap-1">
                          {getPasswordStrengthIcon()}
                          <span className="text-gray-500">
                            {passwordStrength < 25
                              ? "Weak"
                              : passwordStrength < 50
                              ? "Fair"
                              : passwordStrength < 75
                              ? "Good"
                              : "Strong"}
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div
                  className={`transition-all duration-300 ${
                    mode === "signup" ? "block" : "hidden"
                  }`}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword || ""}
                      onChange={(e) =>
                        updateFormField("confirmPassword", e.target.value)
                      }
                      className="input pl-10 pr-10 w-full"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiLock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {mode === "signup"
                        ? "Creating Account..."
                        : "Signing In..."}
                    </>
                  ) : (
                    <>
                      {mode === "signup" ? "Create Account" : "Sign In"}
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                <span className="text-sm text-gray-400">OR</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="btn btn-ghost w-full flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/2048px-Google_%22G%22_logo.svg.png"
                  alt="Google"
                  className="w-5 h-5"
                />
                Continue with Google
              </button>

              {/* Mode Switch */}
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                {mode === "signup"
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <button
                  onClick={() =>
                    switchMode(mode === "signup" ? "signin" : "signup")
                  }
                  className="text-blue-500 dark:text-blue-400 font-semibold hover:underline transition-colors"
                >
                  {mode === "signup" ? "Sign in" : "Create account"}
                </button>
              </p>

              {/* Info Alert */}
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-3">
                  <FiInfo className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {mode === "signup"
                        ? "Start your educational journey"
                        : "Continue learning"}
                    </div>
                    <p className="mt-1 text-xs opacity-80">
                      {mode === "signup"
                        ? "Choose the role that best describes you to get personalized features"
                        : "Access your personalized dashboard and learning materials"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
