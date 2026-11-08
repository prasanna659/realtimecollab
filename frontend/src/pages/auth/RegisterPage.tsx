import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import type { AxiosError } from "axios";
import { User, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { AuthLayout } from "../../layouts/AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import type { ApiErrorBody } from "../../types/auth";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser, isRegistering, registerError } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const serverMessage = (registerError as AxiosError<ApiErrorBody> | null)?.response?.data?.message;

  return (
    <AuthLayout title="Create your account" subtitle="Start collaborating with your team in seconds">
      <form onSubmit={handleSubmit((v) => registerUser(v))} className="space-y-4">

        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <User size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input {...register("name")} placeholder="Ava Chen" className="input pl-10" />
          </div>
          {errors.name && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle size={11} />{errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="label">Work email</label>
          <div className="relative">
            <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input type="email" {...register("email")} placeholder="you@company.com" className="input pl-10" />
          </div>
          {errors.email && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle size={11} />{errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input type="password" {...register("password")} placeholder="At least 8 characters" className="input pl-10" />
          </div>
          {errors.password && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle size={11} />{errors.password.message}
            </p>
          )}
        </div>

        {serverMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5 text-xs text-danger">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{serverMessage}</span>
          </div>
        )}

        <button type="submit" disabled={isRegistering} className="btn-primary w-full py-2.5">
          {isRegistering
            ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Creating account…</span>
            : <><span>Create account</span><ArrowRight size={15} /></>
          }
        </button>

        <p className="text-center text-[11px] text-muted">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>

      <div className="mt-6 border-t border-border pt-5 text-center text-xs text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
