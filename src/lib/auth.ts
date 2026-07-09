import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";

// Simple session token store (in production, use JWT or next-auth)
// For this MVP, we use a simple token format: base64(userId):timestamp
const SESSION_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days

export function createSessionToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + SESSION_DURATION });
  return Buffer.from(payload).toString("base64");
}

export async function verifySession(token: string | null | undefined) {
  if (!token) return null;
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    if (decoded.exp < Date.now()) return null;
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
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
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export function getSessionTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const token = req.cookies.get("rrms-session")?.value;
  return token ?? null;
}

export async function requireAuth(req: NextRequest) {
  const token = getSessionTokenFromRequest(req);
  const user = await verifySession(token);
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, response: null };
}

// Simple password hashing (NOT for production — use bcrypt in real apps)
export async function hashPassword(password: string): Promise<string> {
  // Using a simple salted hash for dev. In production use bcrypt/argon2.
  const salt = "verdara_salt_2025";
  const crypto = await import("crypto");
  const hash = crypto
    .createHash("sha256")
    .update(salt + password)
    .digest("hex");
  return `sha256$${hash}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith("sha256$")) {
    const computed = await hashPassword(password);
    return computed === hash;
  }
  // fallback for plain (dev only)
  return password === hash;
}
