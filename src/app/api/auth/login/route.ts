// DEPRECATED — replaced by NextAuth's /api/auth/[...nextauth] route.
// P0 security: the old custom login endpoint has been removed in favor of
// NextAuth's Credentials provider, which signs JWTs with NEXTAUTH_SECRET.
//
// This file is kept as a stub to return a 410 Gone for any stale clients
// or bookmarks that still POST to /api/auth/login. New login flow:
//   1. Client calls signIn("credentials", { email, password, redirect: false })
//      from next-auth/react — this hits /api/auth/[...nextauth]/credentials.
//   2. NextAuth's authorize() callback verifies the bcrypt hash.
//   3. On success a signed JWT cookie is set automatically.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This login endpoint is deprecated. Use NextAuth's signIn('credentials') instead.",
    },
    { status: 410 }
  );
}
