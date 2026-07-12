// /api/auth/me — returns the current authenticated user, or null.
// P0 security: now backed by NextAuth's getServerSession instead of the
// old base64 cookie. Used by the admin shell to verify session validity
// on mount and to populate the client-side useAuthStore cache.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const id = (session.user as { id?: string }).id;
  if (!id) return NextResponse.json({ user: null }, { status: 200 });

  // Re-fetch to confirm the user is still active in the DB.
  const user = await import("@/lib/db").then(({ db }) =>
    db.user.findUnique({
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
    })
  );

  if (!user || !user.isActive) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user });
}
