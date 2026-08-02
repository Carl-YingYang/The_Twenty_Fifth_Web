// ──────────────────────────────────────────────────────────────────────────
// Per-route auth helpers — throw ApiError on failure, return user on success.
// P0 security: every protected route handler calls these at the top of its
// GET/POST/PATCH/DELETE so RBAC is enforced consistently.
// ──────────────────────────────────────────────────────────────────────────

import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, type SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";

// ── Role hierarchy ────────────────────────────────────────────────────────
// SUPER_ADMIN (3) > ADMIN (2) > STAFF (1). Any other role string ranks 0.
// A user satisfies a role check when their rank is >= the required rank —
// so a SUPER_ADMIN passes every "ADMIN" or "STAFF" check, an ADMIN passes
// every "STAFF" check, and a STAFF user is denied any "ADMIN" check.
//
// This is the intended design documented on requireRole below, and it keeps
// the seed data (where the primary admin is SUPER_ADMIN) compatible with
// route handlers that gate on requireRole(req, "ADMIN").
const ROLE_RANK: Record<string, number> = {
  STAFF: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

/**
 * Require a valid NextAuth session. Returns the user record (re-fetched
 * from the DB to confirm `isActive` is still true). Throws ApiError(401)
 * on missing or invalid session.
 */
export async function requireUser(
  _req?: NextRequest
): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  const id = session?.user ? (session.user as { id?: string }).id : undefined;

  if (!id) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      isActive: true,
      lastLoginAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, "Unauthorized");
  }

  return user;
}

/**
 * Require a specific role. Accepts a single role string OR an array.
 * Throws ApiError(401) if no session, ApiError(403) if role mismatch.
 *
 * Roles follow a hierarchy: SUPER_ADMIN > ADMIN > STAFF. A higher-ranked
 * user satisfies any check for a lower-ranked role — e.g. a SUPER_ADMIN
 * passes `requireRole(req, "ADMIN")` and `requireRole(req, "STAFF")`.
 * Pass an array if multiple non-adjacent roles are allowed for the action.
 *
 * Example: `requireRole(req, "ADMIN")` admits SUPER_ADMIN + ADMIN.
 *          `requireRole(req, ["ADMIN", "STAFF"])` admits all three.
 */
export async function requireRole(
  req: NextRequest,
  role: string | string[]
): Promise<SessionUser> {
  const user = await requireUser(req);
  const allowed = Array.isArray(role) ? role : [role];
  const userRank = ROLE_RANK[user.role] ?? 0;

  // A user satisfies the check if their rank is >= any allowed role's rank.
  // Unknown role strings on either side rank 0, so they never elevate
  // privilege — only the three documented roles can pass a check.
  const satisfies = allowed.some((r) => userRank >= (ROLE_RANK[r] ?? 0));

  if (!satisfies) {
    throw new ApiError(403, "Forbidden");
  }
  return user;
}
