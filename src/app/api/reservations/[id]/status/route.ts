import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/app/api/_lib/auth-helpers";
import { ApiError, apiError } from "@/lib/api";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  NO_SHOW: [],
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // P0 security: reservation detail exposes guest PII.
    await requireUser(req);
    const { id } = await params;
    const reservation = await db.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        rooms: { include: { room: { include: { type: true, images: true } } } },
      },
    });
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }
    return NextResponse.json({ reservation });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("Get reservation status error:", err);
    return apiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user: Awaited<ReturnType<typeof requireUser>>;
  try {
    user = await requireUser(req);
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    throw err;
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, rejectedReason } = body as { status: string; rejectedReason?: string };

    const reservation = await db.reservation.findUnique({
      where: { id },
      include: { rooms: true },
    });
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const allowed = VALID_TRANSITIONS[reservation.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${reservation.status} to ${status}` },
        { status: 400 }
      );
    }

    const now = new Date();
    const patch: Record<string, unknown> = { status };
    if (status === "CONFIRMED") patch.confirmedAt = now;
    if (status === "CANCELLED") patch.cancelledAt = now;
    if (status === "CHECKED_IN") patch.checkedInAt = now;
    if (status === "COMPLETED") patch.checkedOutAt = now;
    if (status === "REJECTED") patch.rejectedReason = rejectedReason ?? null;

    const updated = await db.reservation.update({
      where: { id },
      data: patch,
      include: {
        guest: true,
        rooms: { include: { room: { include: { type: true } } } },
      },
    });

    // Update room status based on reservation status
    if (status === "CONFIRMED") {
      for (const rr of updated.rooms) {
        await db.room.update({ where: { id: rr.roomId }, data: { status: "RESERVED" } });
      }
    } else if (status === "CHECKED_IN") {
      for (const rr of updated.rooms) {
        await db.room.update({ where: { id: rr.roomId }, data: { status: "OCCUPIED" } });
      }
    } else if (status === "COMPLETED" || status === "CANCELLED" || status === "NO_SHOW") {
      for (const rr of updated.rooms) {
        await db.room.update({ where: { id: rr.roomId }, data: { status: "CLEANING" } });
      }
    } else if (status === "REJECTED") {
      for (const rr of updated.rooms) {
        const room = await db.room.findUnique({ where: { id: rr.roomId } });
        if (room && room.status === "RESERVED") {
          await db.room.update({ where: { id: rr.roomId }, data: { status: "AVAILABLE" } });
        }
      }
    }

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: `RESERVATION_${status}`,
        entity: "Reservation",
        entityId: id,
        details: `${reservation.referenceNo}: ${reservation.status} → ${status}`,
      },
    });

    return NextResponse.json({ reservation: updated });
  } catch (error) {
    console.error("Update reservation status error:", error);
    return NextResponse.json(
      { error: "Failed to update reservation" },
      { status: 500 }
    );
  }
}
