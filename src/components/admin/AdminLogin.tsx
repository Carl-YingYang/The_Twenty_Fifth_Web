"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Leaf, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/store/useAuthStore";
import { useViewStore } from "@/store/useViewStore";
import { ADMIN_CREDENTIALS } from "@/lib/constants";
import type { User } from "@/types";

export function AdminLogin() {
  const { login } = useAuthStore();
  const { navigate } = useViewStore();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    try {
      const data = await apiFetch<{ user: User; token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
      navigate("admin-dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo() {
    setValue("email", ADMIN_CREDENTIALS.email);
    setValue("password", ADMIN_CREDENTIALS.password);
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0F2E22] text-white">
      {/* Decorative leaf pattern */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="leaves" width="120" height="120" patternUnits="userSpaceOnUse">
            <path
              d="M60 10 C 30 30, 30 70, 60 110 C 90 70, 90 30, 60 10 Z M60 30 L60 90"
              stroke="#E6F0EA"
              strokeWidth="1"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#leaves)" />
      </svg>

      {/* Gradient glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-700/30 blur-3xl" />

      {/* Back link */}
      <button
        onClick={() => navigate("home")}
        className="group absolute left-6 top-6 z-10 inline-flex items-center gap-2 text-sm text-emerald-100/80 transition hover:text-white"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Back to website
      </button>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-lg shadow-emerald-900/40">
                <Leaf className="size-7 text-white" />
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
                Verdara Admin
              </h1>
              <p className="mt-1 text-sm text-emerald-100/70">
                Sign in to the Reservation Management System
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-emerald-50/90">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-emerald-200/60" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@verdararesort.com"
                    {...register("email")}
                    className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-emerald-100/40 focus-visible:border-emerald-400/60 focus-visible:ring-emerald-400/20"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-300">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-emerald-50/90">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-emerald-200/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="border-white/10 bg-white/5 pl-9 pr-10 text-white placeholder:text-emerald-100/40 focus-visible:border-emerald-400/60 focus-visible:ring-emerald-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-200/60 transition hover:text-emerald-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-300">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="mt-2 h-10 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/30 hover:from-emerald-400 hover:to-emerald-500"
              >
                {submitting ? "Signing in…" : "Sign in to Dashboard"}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-200/80">
                <ShieldCheck className="size-3.5" />
                Demo credentials
              </div>
              <div className="space-y-1 font-mono text-xs text-emerald-100/80">
                <div>
                  <span className="text-emerald-200/60">email:</span>{" "}
                  {ADMIN_CREDENTIALS.email}
                </div>
                <div>
                  <span className="text-emerald-200/60">password:</span>{" "}
                  {ADMIN_CREDENTIALS.password}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={fillDemo}
                className="mt-3 h-7 w-full justify-center border border-white/10 text-xs text-emerald-100/80 hover:bg-white/10 hover:text-white"
              >
                Autofill credentials
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-emerald-100/50">
            © {new Date().getFullYear()} Verdara Resort · Internal use only
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminLogin;
