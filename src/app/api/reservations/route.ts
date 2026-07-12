import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nightsBetween, generateReferenceNo } from "@/lib/utils";
import { reservationCreateSchema } from "@/lib/validators";
import { requireUser } from "@/app/api/_lib/auth-helpers";
import { ApiError, apiError } from "@/lib/api";
import { reservationLimiter, rateLimit, getClientIp, retryAfterSeconds } from "@/lib/rate-limit";

// GET — list reservations with optional filters.
// P0 security: exposes guest PII (name, email, phone) → admin/staff only.
// Public booking submission (POST) is below and stays unauthenticated.
export async function GET(req: NextRequest) {
  try {
    await requireUser(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { referenceNo: { contains: search } },
        { guest: { firstName: { contains: search } } },
        { guest: { lastName: { contains: search } } },
        { guest: { email: { contains: search } } },
        { guest: { phone: { contains: search } } },
      ];
    }

    const reservations = await db.reservation.findMany({
      where,
      include: {
        guest: true,
        rooms: { include: { room: { include: { type: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ reservations });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("List reservations error:", err);
    return apiError(err);
  }
}

// POST — public booking submission (guest-facing).
// P0 security: wraps the entire multi-step mutation in a prisma.$transaction
// to guarantee atomicity. If guest upsert succeeds but reservation create
// fails, the whole thing rolls back — no orphan guests, no double-bookings.
// P1 security: rate-limited to 10 bookings/min per IP to prevent spam.
export async function POST(req: NextRequest) {
  try {
    // ── P1 rate limit (IP-based — this is a public endpoint) ──
    const ip = getClientIp(req);
    const rl = await rateLimit(reservationLimiter, ip);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: "Too many booking requests. Please wait a minute and try again." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds(rl.reset)) } }
      );
    }

    const body = await req.json();
    const parsed = reservationCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const d = parsed.data;

    const ci = new Date(d.checkIn);
    const co = new Date(d.checkOut);
    if (co <= ci) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 }
      );
    }

    const nights = nightsBetween(ci, co);

    // Run the entire availability check + guest upsert + reservation create
    // + audit log inside a single transaction. If any step fails, all
    // prior writes are rolled back automatically — preventing double-bookings
    // and orphan guest rows on partial failure.
    const reservation = await db.$transaction(async (tx) => {
      // ── Step 1: re-validate room + capacity + availability inside the tx ──
      // (The room was checked client-side, but we MUST re-check here under the
      // transaction's isolation to close the race window between two concurrent
      // booking requests for overlapping dates.)
      const room = await tx.room.findUnique({
        where: { id: d.roomId },
      });
      if (!room || !room.isActive) {
        throw new ApiError(404, "Room not found");
      }
      if (room.capacity < d.adults + d.children) {
        throw new ApiError(400, `Room capacity is ${room.capacity} guests`);
      }

      const overlap = await tx.reservation.findFirst({
        where: {
          status: { notIn: ["CANCELLED", "REJECTED"] },
          rooms: { some: { roomId: d.roomId } },
          AND: [
            { checkIn: { lt: co } },
            { checkOut: { gt: ci } },
          ],
        },
      });
      if (overlap) {
        throw new ApiError(409, "Room is not available for the selected dates");
      }

      // ── Check for admin-blocked dates (Step 6: Block Dates feature) ──
      // The admin can manually block a date range on a room (owner use,
      // maintenance, holiday holds). Public bookings must respect these.
      const blockedOverlap = await tx.blockedDate.findFirst({
        where: {
          roomId: d.roomId,
          AND: [
            { startDate: { lt: co } },
            { endDate: { gt: ci } },
          ],
        },
      });
      if (blockedOverlap) {
        throw new ApiError(
          409,
          "Room is not available for the selected dates"
        );
      }

      const totalAmount = room.pricePerNight * nights;

      // ── Step 2: upsert the guest (find-or-create by email) ──
      let guest = await tx.guest.findFirst({ where: { email: d.guest.email } });
      if (!guest) {
        guest = await tx.guest.create({
          data: {
            firstName: d.guest.firstName,
            lastName: d.guest.lastName,
            email: d.guest.email,
            phone: d.guest.phone,
            address: d.guest.address || null,
            city: d.guest.city || null,
            country: d.guest.country || null,
          },
        });
      } else {
        // Update missing info without overwriting existing fields.
        await tx.guest.update({
          where: { id: guest.id },
          data: {
            ...(d.guest.address ? { address: d.guest.address } : {}),
            ...(d.guest.city ? { city: d.guest.city } : {}),
            ...(d.guest.country ? { country: d.guest.country } : {}),
          },
        });
      }

      // ── Step 3: create the reservation + reservation-room link ──
      // Generate a unique reference number (collision-safe loop inside tx).
      let referenceNo = generateReferenceNo();
      let exists = await tx.reservation.findUnique({ where: { referenceNo } });
      while (exists) {
        referenceNo = generateReferenceNo();
        exists = await tx.reservation.findUnique({ where: { referenceNo } });
      }

      const created = await tx.reservation.create({
        data: {
          referenceNo,
          guestId: guest.id,
          checkIn: ci,
          checkOut: co,
          adults: d.adults,
          children: d.children,
          nights,
          totalAmount,
          status: "PENDING",
          source: "WEBSITE",
          specialRequests: d.specialRequests || null,
          rooms: {
            create: {
              roomId: d.roomId,
              pricePerNight: room.pricePerNight,
              subtotal: totalAmount,
            },
          },
        },
        include: {
          guest: true,
          rooms: { include: { room: { include: { type: true } } } },
        },
      });

      // ── Step 4: write an audit log for the public booking ──
      // entityId references the new reservation; userId is null because
      // the submitter is an unauthenticated guest.
      await tx.auditLog.create({
        data: {
          userId: null,
          action: "RESERVATION_CREATED_PUBLIC",
          entity: "Reservation",
          entityId: created.id,
          details: `Public booking ${referenceNo} for ${guest.firstName} ${guest.lastName} (${nights}n, ₱${totalAmount})`,
        },
      });

      return created;
    });

    // ── Side-effects outside the transaction (non-fatal if they fail) ──
    // Admin notifications don't roll back the booking — guests expect their
    // confirmation regardless of whether an admin got pinged. The original
    // .catch(() => {}) swallow is preserved here deliberately.
    const admins = await db.user.findMany({
      where: { isActive: true, role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    });
    for (const a of admins) {
      await db.notification
        .create({
          data: {
            userId: a.id,
            title: `New Reservation ${reservation.referenceNo}`,
            message: `${reservation.guest.firstName} ${reservation.guest.lastName} booked a room (${nights} nights)`,
            type: "BOOKING",
            isRead: false,
            link: `admin-bookings?id=${reservation.id}`,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    // ApiError carries a real status (404 room, 400 capacity, 409 overlap).
    if (error instanceof ApiError) {
      return apiError(error, error.statusCode);
    }
    console.error("Create reservation error:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}
