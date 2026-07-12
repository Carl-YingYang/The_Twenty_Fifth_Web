// ──────────────────────────────────────────────────────────────────────────
// Rate Limiting — Upstash Redis (sliding window).
// P1 security: protects auth, booking, and chat endpoints from abuse.
//
// Fail-open in dev: if UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are
// not set, every check returns success so local development and preview
// deploys without Upstash still work. A warning is logged once. A Redis
// outage in production must NOT take the site down — we fail open and log.
// ──────────────────────────────────────────────────────────────────────────

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let upstashWarningLogged = false;
function logMissingUpstash() {
  if (upstashWarningLogged) return;
  upstashWarningLogged = true;
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. " +
      "Rate limiting is DISABLED (fail-open). Set both in .env for production."
  );
}

// Shared Redis client — null when env vars are missing (dev fallback).
const redis: Redis | null =
  UPSTASH_URL && UPSTASH_TOKEN
    ? new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN })
    : null;

// ── Limiters ──────────────────────────────────────────────────────────────
// slidingWindow(maxRequests, window) — a fixed-size sliding window. More
// accurate than a fixed window and cheap on Upstash.

export const loginLimiter = new Ratelimit({
  redis: redis ?? ({} as Redis), // never used when redis is null (fail-open)
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:login",
  analytics: false,
});

export const reservationLimiter = new Ratelimit({
  redis: redis ?? ({} as Redis),
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "ratelimit:reservation",
  analytics: false,
});

export const chatLimiter = new Ratelimit({
  redis: redis ?? ({} as Redis),
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  prefix: "ratelimit:chat",
  analytics: false,
});

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms when the window resets. */
  reset: number;
}

/**
 * Check a rate limiter for an identifier. NEVER throws — on any error
 * (Redis down, missing env, etc.) returns `{ success: true, ... }` so the
 * request proceeds (fail-open).
 *
 * @param limiter  One of loginLimiter / reservationLimiter / chatLimiter.
 * @param identifier  IP address, user ID, or a composite key.
 */
export async function rateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  // Fail-open when Upstash is not configured (local dev / preview).
  if (!redis) {
    logMissingUpstash();
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  try {
    const res = await limiter.limit(identifier);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  } catch (err) {
    // Redis outage / network error — fail open, log loudly.
    console.error(
      "[rate-limit] Upstash check failed (fail-open):",
      (err as Error)?.message
    );
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}

/**
 * Extract the client IP from a Next.js request. Checks the standard
 * forwarded headers (set by Vercel / Caddy) before falling back to a
 * dev placeholder.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "127.0.0.1"
  );
}

/**
 * Build a Retry-After header value (seconds) from a rate-limit reset
 * timestamp. Minimum 1s so clients don't retry instantly.
 */
export function retryAfterSeconds(reset: number): number {
  if (!reset) return 60;
  const secs = Math.ceil((reset - Date.now()) / 1000);
  return Math.max(1, secs);
}
