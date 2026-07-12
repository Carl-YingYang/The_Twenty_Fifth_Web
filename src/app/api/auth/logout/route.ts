// DEPRECATED — replaced by NextAuth's /api/auth/[...nextauth] route.
// P0 security: clients should call signOut() from next-auth/react, which
// hits /api/auth/signout and clears the NextAuth JWT cookie.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This logout endpoint is deprecated. Use next-auth/react's signOut() instead.",
    },
    { status: 410 }
  );
}
