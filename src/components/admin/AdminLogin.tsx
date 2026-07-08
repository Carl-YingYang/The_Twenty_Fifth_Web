"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Waves,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/store/useAuthStore";
import { useViewStore } from "@/store/useViewStore";
import { ADMIN_CREDENTIALS, RESORT_INFO } from "@/lib/constants";
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
      const data = await apiFetch<{ user: User; token: string }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(values),
        }
      );
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}.`);
      navigate("admin-dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "We couldn't sign you in. Please try again.";
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
    <div className="relative grid min-h-screen grid-cols-1 xl:grid-cols-[1.1fr_1fr]">
      {/* Left: brand panel — hidden below xl to give form room on tablets/large phones */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0A3D4A] p-10 text-white xl:flex lg:p-14">
        {/* Decorative ocean pattern */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.10]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="waves"
              width="160"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 40 C 40 10, 80 10, 120 40 S 200 70, 240 40"
                stroke="#E8F1F4"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M0 70 C 40 40, 80 40, 120 70 S 200 100, 240 70"
                stroke="#E8F1F4"
                strokeWidth="1"
                fill="none"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#waves)" />
        </svg>

        {/* Glow */}
        <div className="pointer-events-none absolute -right-32 top-1/4 size-96 rounded-full bg-coral/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 size-96 rounded-full bg-[#4DBFD4]/20 blur-3xl" />

        <button
          onClick={() => navigate("home")}
          className="group relative z-10 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Back to website
        </button>

        <div className="relative z-10 flex flex-col">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Waves className="size-7 text-white" />
          </div>
          <div className="eyebrow !text-coral">Admin Suite</div>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-white lg:text-5xl">
            {RESORT_INFO.name}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80 lg:text-base">
            {RESORT_INFO.tagline}
          </p>
        </div>

        <div className="relative z-10 text-xs text-white/60">
          {RESORT_INFO.addressShort} · Internal use only
        </div>
      </div>

      {/* Right: form panel */}
      <div className="relative flex items-center justify-center bg-background px-4 py-10 sm:px-6 xl:py-14">
        {/* Mobile back link — visible below xl since brand panel is hidden */}
        <button
          onClick={() => navigate("home")}
          className="group absolute left-4 top-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground sm:left-5 sm:top-5 sm:text-sm xl:hidden"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>

        <div className="w-full max-w-sm sm:max-w-md">
          {/* Brand header — visible below xl since left brand panel is hidden */}
          <div className="mb-6 flex flex-col items-center text-center xl:hidden">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-[#0A3D4A]">
              <Waves className="size-6 text-white" />
            </div>
            <div className="eyebrow">Admin Suite</div>
            <h1 className="mt-1 font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">
              {RESORT_INFO.name}
            </h1>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-7 xl:p-8">
            {/* Form heading — always visible (hidden on xl only if brand panel shows it, but we show it always for clarity) */}
            <div className="mb-6">
              <div className="eyebrow">Sign in</div>
              <h2 className="mt-1 font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage reservations, the villa, and guests.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="stay@the25thinzambales.com"
                    {...register("email")}
                    className="h-11 pl-9"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-700">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="h-11 pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-700">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="mt-2 h-11 w-full bg-primary text-white hover:bg-primary/90"
              >
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-5 rounded-lg border border-border bg-muted/50 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Demo credentials
              </div>
              <div className="space-y-1 font-mono text-xs text-foreground break-all sm:text-sm">
                <div>
                  <span className="text-muted-foreground">email:</span>{" "}
                  {ADMIN_CREDENTIALS.email}
                </div>
                <div>
                  <span className="text-muted-foreground">password:</span>{" "}
                  {ADMIN_CREDENTIALS.password}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillDemo}
                className="mt-3 h-9 w-full text-xs"
              >
                Autofill credentials
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {RESORT_INFO.name} · Internal use only
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
