import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, getSessionTokenFromRequest, verifySession } from "@/lib/auth";
import { ApiError, apiError, parseBody } from "@/lib/api";
import { notificationUpdateSchema } from "@/lib/validators";

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
  try {
    const { user, response } = await requireAuth(req);
    if (!user) return response!;

    // P1: strict Zod validation (was reading body without validation).
    const d = await parseBody(req, notificationUpdateSchema);

    if (d.markAllRead) {
      await db.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (d.id) {
      // P1: scope the update to the authenticated user's own notifications
      // so an admin can't flip another user's notification by guessing id.
      await db.notification.updateMany({
        where: { id: d.id, userId: user.id },
        data: { isRead: true },
      });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("Update notification error:", err);
    return apiError(err);
  }
}
