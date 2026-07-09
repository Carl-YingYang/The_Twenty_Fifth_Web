import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, getSessionTokenFromRequest, verifySession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getSessionTokenFromRequest(req);
  const user = await verifySession(token);
  if (!user) return NextResponse.json({ notifications: [] });

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ notifications });
}

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  try {
    const body = await req.json();
    const { id, markAllRead } = body as { id?: string; markAllRead?: boolean };

    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (id) {
      await db.notification.update({
        where: { id },
        data: { isRead: true },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
