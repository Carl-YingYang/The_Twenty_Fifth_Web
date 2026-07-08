import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nightsBetween, generateReferenceNo } from "@/lib/utils";
import { reservationCreateSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
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
}

export async function POST(req: NextRequest) {
  try {
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

    const room = await db.room.findUnique({
      where: { id: d.roomId },
    });
    if (!room || !room.isActive) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.capacity < d.adults + d.children) {
      return NextResponse.json(
        { error: `Room capacity is ${room.capacity} guests` },
        { status: 400 }
      );
    }

    // Check for overlapping reservations
    const overlap = await db.reservation.findFirst({
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
      return NextResponse.json(
        { error: "Room is not available for the selected dates" },
        { status: 409 }
      );
    }

    const nights = nightsBetween(ci, co);
    const totalAmount = room.pricePerNight * nights;

    // Find or create guest
    let guest = await db.guest.findFirst({ where: { email: d.guest.email } });
    if (!guest) {
      guest = await db.guest.create({
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
      // update missing info
      await db.guest.update({
        where: { id: guest.id },
        data: {
          ...(d.guest.address ? { address: d.guest.address } : {}),
          ...(d.guest.city ? { city: d.guest.city } : {}),
          ...(d.guest.country ? { country: d.guest.country } : {}),
        },
      });
    }

    // Generate unique reference number
    let referenceNo = generateReferenceNo();
    let exists = await db.reservation.findUnique({ where: { referenceNo } });
    while (exists) {
      referenceNo = generateReferenceNo();
      exists = await db.reservation.findUnique({ where: { referenceNo } });
    }

    const reservation = await db.reservation.create({
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

    // Notify all admins
    const admins = await db.user.findMany({ where: { isActive: true, role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
    for (const a of admins) {
      await db.notification.create({
        data: {
          userId: a.id,
          title: `New Reservation ${referenceNo}`,
          message: `${guest.firstName} ${guest.lastName} booked ${room.name} (${nights} nights)`,
          type: "BOOKING",
          isRead: false,
          link: `admin-bookings?id=${reservation.id}`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error("Create reservation error:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}
