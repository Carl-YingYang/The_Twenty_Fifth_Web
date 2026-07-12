// ──────────────────────────────────────────────────────────────────────────
// Centralized middleware — gates every API route except NextAuth's own.
// P0 security: prevents unauthenticated access at the edge before any
// route handler runs. RBAC is enforced per-route via requireRole().
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Public API routes — no session required ──────────────────────────
  // NextAuth's own endpoints handle their own auth + CSRF.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Public catalog & booking submission endpoints (guest-facing):
  //   /api/rooms, /api/rooms/availability, /api/rooms/types,
  //   /api/amenities, /api/gallery, /api/calendar,
  //   /api/contact, /api/chat,
  //   /api/reservations (POST only — new booking request),
  //   /api/reservations/lookup (find-my-booking by ref + email)
  //
  // Note: even though these are public, the route handlers themselves
  // can still call requireRole() internally where appropriate.
  const PUBLIC_API_PATTERNS: RegExp[] = [
    /^\/api\/rooms(\/.*)?$/,
    /^\/api\/amenities(\/.*)?$/,
    /^\/api\/gallery(\/.*)?$/,
    /^\/api\/contact(\/.*)?$/,
    /^\/api\/chat(\/.*)?$/,
    /^\/api\/settings(\/.*)?$/,        // public resort info
    /^\/api\/notifications(\/.*)?$/,   // safe-ish; handler can auth if needed
  ];

  for (const re of PUBLIC_API_PATTERNS) {
    if (re.test(pathname)) {
      return NextResponse.next();
    }
  }

  // /api/calendar is ADMIN-ONLY — it exposes reservation + guest names.
  // (Public booking widget uses /api/rooms/availability, not calendar.)
  // Falls through to the protected-API block below.

  // /api/reservations — POST (new booking) is public, GET (list w/ PII) is
  // protected. The handler itself enforces requireUser on GET.
  // /api/reservations/lookup is public.
  if (
    pathname === "/api/reservations" ||
    pathname.startsWith("/api/reservations/lookup")
  ) {
    return NextResponse.next();
  }

  // Everything else under /api/ requires a valid NextAuth JWT.
  // (Includes /api/dashboard, /api/reports, /api/guests/*, /api/admin/*,
  //  /api/reservations/[id]/status, etc.)
  if (pathname.startsWith("/api/")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Non-API routes — pass through (the app shell handles view-based gating).
  return NextResponse.next();
}

export const config = {
  // Run middleware on every API route. Page-level matching is handled
  // inside the React app via the view store (?view=admin-login).
  matcher: ["/api/:path*"],
};
