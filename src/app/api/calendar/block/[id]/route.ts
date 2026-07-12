import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/app/api/_lib/auth-helpers";
import { ApiError, apiError } from "@/lib/api";

// DELETE /api/calendar/block/[id] — remove a date-range block (admin only).
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole(req, "ADMIN");
    const { id } = await params;

    const block = await db.blockedDate.findUnique({
      where: { id },
      include: { room: { select: { number: true, name: true } } },
    });
    if (!block) {
      throw new ApiError(404, "Block not found");
    }

    await db.blockedDate.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "DATES_UNBLOCKED",
        entity: "BlockedDate",
        entityId: id,
        details: `Unblocked ${block.room.name} (${block.room.number}) from ${block.startDate.toDateString()} to ${block.endDate.toDateString()}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("Delete blocked date error:", err);
    return apiError(err);
  }
}
