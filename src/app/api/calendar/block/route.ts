import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/app/api/_lib/auth-helpers";
import { ApiError, apiError, parseBody } from "@/lib/api";
import { blockDateCreateSchema } from "@/lib/validators";

// ============================================================
// /api/calendar/block — admin manages date-range blocks on rooms.
//
// GET    /api/calendar/block          — list all blocks (admin only)
// POST   /api/calendar/block          — create a new block (admin only)
// DELETE /api/calendar/block/[id]     — remove a block (admin only)
//
// A block prevents public bookings for [startDate, endDate) on a
// specific room. The reservation POST handler checks for overlaps
// and rejects with 409. The calendar UI renders blocked days in red.
// ============================================================

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    const blocks = await db.blockedDate.findMany({
      where: roomId ? { roomId } : undefined,
      include: {
        room: { select: { id: true, number: true, name: true } },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ blocks });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("List blocked dates error:", err);
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireRole(req, "ADMIN");

    const d = await parseBody(req, blockDateCreateSchema);

    // ── Validate the room exists ──
    const room = await db.room.findUnique({ where: { id: d.roomId } });
    if (!room || !room.isActive) {
      throw new ApiError(404, "Room not found");
    }

    const startDate = new Date(d.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(d.endDate);
    endDate.setHours(0, 0, 0, 0);

    // ── Check for overlap with existing reservations ──
    // We don't want to block dates that already have active bookings —
    // the admin should cancel those first. This keeps the data clean.
    const conflictingReservation = await db.reservation.findFirst({
      where: {
        status: { notIn: ["CANCELLED", "REJECTED"] },
        rooms: { some: { roomId: d.roomId } },
        AND: [
          { checkIn: { lt: endDate } },
          { checkOut: { gt: startDate } },
        ],
      },
    });
    if (conflictingReservation) {
      throw new ApiError(
        409,
        `Cannot block — ${conflictingReservation.referenceNo} already books these dates. Cancel the reservation first.`
      );
    }

    // ── Create the block ──
    const block = await db.blockedDate.create({
      data: {
        roomId: d.roomId,
        startDate,
        endDate,
        reason: d.reason?.trim() || null,
        createdBy: user.id,
      },
      include: {
        room: { select: { id: true, number: true, name: true } },
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "DATES_BLOCKED",
        entity: "BlockedDate",
        entityId: block.id,
        details: `Blocked ${room.name} (${room.number}) from ${startDate.toDateString()} to ${endDate.toDateString()}${d.reason ? ` — ${d.reason}` : ""}`,
      },
    });

    return NextResponse.json({ block }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("Create blocked date error:", err);
    return apiError(err);
  }
}
