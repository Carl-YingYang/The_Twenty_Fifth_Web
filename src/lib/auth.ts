// ──────────────────────────────────────────────────────────────────────────
// NextAuth configuration — Credentials provider + JWT sessions.
// P0 security: replaces the old base64-encoded, unsigned session token.
// ──────────────────────────────────────────────────────────────────────────

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "./db";
import { verifyPassword, isLegacyHash } from "./password";

// ── Build-time guard: refuse to boot without a NEXTAUTH_SECRET ────────────
// Throwing at module load ensures `next build` fails loudly if the env
// is missing, rather than silently shipping an unsecured JWT signer.
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "FATAL: NEXTAUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to .env"
  );
}

const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, in seconds

export const authOptions: NextAuthOptions = {
  // JWT strategy — stateless, signed with NEXTAUTH_SECRET. No DB session
  // table required; works cleanly on serverless (Vercel).
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  providers: [
    CredentialsProvider({
      name: "The Twenty-Fifth Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        // Fail closed on missing user, inactive user, or legacy hash that
        // hasn't been re-seeded with bcrypt.
        if (!user || !user.isActive) return null;
        if (isLegacyHash(user.passwordHash)) {
          // Legacy sha256 hashes are no longer trusted — admin must re-seed.
          console.error(
            `[auth] Refusing login for ${user.email}: legacy password hash detected. Re-seed the database with bcrypt.`
          );
          return null;
        }

        const ok = await verifyPassword(credentials.password, user.passwordHash);
        if (!ok) return null;

        // Stamp lastLoginAt for audit purposes.
        await db.user
          .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          .catch(() => {
            /* non-fatal: don't fail the login over a stale timestamp */
          });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    // Persist id + role onto the JWT so the session callback can read them.
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    // Expose id + role to the client session object.
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string | undefined;
        (session.user as { role?: string }).role = token.role as
          | string
          | undefined;
      }
      return session;
    },
  },
  pages: {
    // We don't use NextAuth's hosted sign-in page — the app's own
    // ?view=admin-login screen handles the UI. This route is only used
    // if NextAuth needs to redirect on its own (e.g. unauthenticated
    // middleware hit). Point it back at the app's view param.
    signIn: "/?view=admin-login",
  },
  // Use HttpOnly + SameSite=Lax cookies. Secure is auto-enabled in
  // production by NextAuth based on NEXTAUTH_URL's protocol.
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Convenience export — most route handlers call this.
export async function getSession() {
  return getServerSession(authOptions);
}

// ──────────────────────────────────────────────────────────────────────────
// COMPAT SHIM — keep the old public API of lib/auth.ts alive so existing
// route handlers that import { requireAuth, verifySession, ... } keep
// working without rewrite. Internally everything now delegates to
// NextAuth's getServerSession.
// ──────────────────────────────────────────────────────────────────────────

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
};

/**
 * Verify a session by reading NextAuth's JWT cookie. The `token` arg is
 * kept for backward-compat with the old signature but is no longer used —
 * NextAuth reads its own cookie automatically via getServerSession.
 */
export async function verifySession(
  _token?: string | null
): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const id = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role;
  if (!id) return null;

  // Re-fetch the user to confirm they're still active. This is the same
  // check the old code did after decoding the token.
  const dbUser = await db.user.findUnique({
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
  if (!dbUser || !dbUser.isActive) return null;
  return dbUser;
}

/**
 * Read the session token from a request. Kept for backward-compat —
 * NextAuth now manages its own cookie, so callers don't need this.
 */
export function getSessionTokenFromRequest(
  _req: NextRequest
): string | null {
  // NextAuth's cookie is httpOnly and read internally by getServerSession.
  // Return null — actual verification happens in verifySession().
  return null;
}

/**
 * Compat wrapper around the old requireAuth(req) signature. Returns
 * `{ user, response }` where `response` is a 401 NextResponse if no
 * valid session exists. New code should prefer `requireUser` from
 * `@/app/api/_lib/auth-helpers` instead.
 */
export async function requireAuth(req: NextRequest): Promise<{
  user: SessionUser | null;
  response: NextResponse | null;
}> {
  const user = await verifySession();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, response: null };
}

// Re-export password helpers from their new home, so any code that still
// imports them from `@/lib/auth` keeps working.
export { hashPassword, verifyPassword } from "./password";

// Deprecated — no longer creates tokens (NextAuth does). Kept only so old
// imports don't break the build. Returns an empty string.
export function createSessionToken(_userId: string): string {
  return "";
}
