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
 * Roles: SUPER_ADMIN > ADMIN > STAFF. The check is exact-match by design
 * — pass an array if multiple roles are allowed for the action.
 */
export async function requireRole(
  req: NextRequest,
  role: string | string[]
): Promise<SessionUser> {
  const user = await requireUser(req);
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.role)) {
    throw new ApiError(403, "Forbidden");
  }
  return user;
}
