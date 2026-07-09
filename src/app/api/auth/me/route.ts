import { NextRequest, NextResponse } from "next/server";
import { verifySession, getSessionTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getSessionTokenFromRequest(req);
  const user = await verifySession(token);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user });
}
