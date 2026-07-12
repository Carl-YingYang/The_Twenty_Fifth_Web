// ──────────────────────────────────────────────────────────────────────────
// Password Hashing — bcrypt, cost factor 12.
// P0 security: replaces the old sha256 + static-salt scheme in lib/auth.ts.
// ──────────────────────────────────────────────────────────────────────────

import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

/**
 * Hash a plaintext password using bcrypt (cost 12). Safe to call from
 * seed scripts, user-creation endpoints, and password-reset flows.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Verify a plaintext password against a stored hash. Returns false on
 * any failure (never throws) so callers can use a single code path:
 *   const ok = await verifyPassword(input, user.passwordHash);
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Detect whether a stored hash looks like a legacy sha256$... hash.
 * Used by the NextAuth `authorize` callback to fail closed on legacy
 * accounts that haven't been re-seeded with bcrypt yet.
 */
export function isLegacyHash(hash: string): boolean {
  return typeof hash === "string" && hash.startsWith("sha256$");
}
