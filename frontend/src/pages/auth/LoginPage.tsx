/**
 * LoginPage Component
 * 
 * Handles user authentication with email and password.
 * Features:
 * - Email and password validation using Zod schema
 * - Form state management with React Hook Form
 * - Server-side error handling and display
 * - Loading state during authentication
 * - Link to registration page for new users
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import type { AxiosError } from "axios";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { AuthLayout } from "../../layouts/AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import type { ApiErrorBody } from "../../types/auth";

/**
 * Zod validation schema for login form
 * Validates email format and requires a non-empty password
 */
const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

/**
 * LoginPage - Main login component
 * Renders a form for user authentication within an AuthLayout
 */
export default function LoginPage() {
  // Auth hook: provides login function and state
  const { login, isLoggingIn, loginError } = useAuth();
  
  // React Hook Form setup with Zod validation
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  
  // Extract server error message from Axios error response
  const serverMessage = (loginError as AxiosError<ApiErrorBody> | null)?.response?.data?.message;

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your workspace">
      {/* Login Form */}
      <form onSubmit={handleSubmit((v) => login(v))} className="space-y-4">

        {/* Email Field */}
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            {/* Mail icon */}
            <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            {/* Email input with react-hook-form registration */}
            <input type="email" {...register("email")} placeholder="you@company.com" className="input pl-10" />
          </div>
          {/* Display email validation error if exists */}
          {errors.email && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle size={11} />{errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label !mb-0">Password</label>
          </div>
          <div className="relative">
            {/* Lock icon */}
            <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            {/* Password input with react-hook-form registration */}
            <input type="password" {...register("password")} placeholder="••••••••" className="input pl-10" />
          </div>
          {/* Display password validation error if exists */}
          {errors.password && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle size={11} />{errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="remember" className="h-4 w-4 accent-primary rounded" />
          <label htmlFor="remember" className="cursor-pointer text-xs text-ink-2">Remember me for 30 days</label>
        </div>

        {/* Server Error Alert - displays only if login fails on server */}
        {serverMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5 text-xs text-danger">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{serverMessage}</span>
          </div>
        )}

        {/* Submit Button - shows loading spinner when authentication is in progress */}
        <button type="submit" disabled={isLoggingIn} className="btn-primary w-full py-2.5">
          {isLoggingIn
            ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Signing in…</span>
            : <><span>Sign in</span><ArrowRight size={15} /></>
          }
        </button>
      </form>

      {/* Registration Link - redirects to register page for new users */}
      <div className="mt-6 border-t border-border pt-5 text-center text-xs text-muted">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline">
          Create one free
        </Link>
      </div>
    </AuthLayout>
  );
}
