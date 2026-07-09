import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { guestUpdateSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const guests = await db.guest.findMany({
    where,
    include: {
      reservations: { select: { id: true, status: true, referenceNo: true, checkIn: true, checkOut: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const formatted = guests.map((g) => ({
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    email: g.email,
    phone: g.phone,
    address: g.address,
    city: g.city,
    country: g.country,
    notes: g.notes,
    createdAt: g.createdAt,
    reservationCount: g.reservations.length,
    reservations: g.reservations,
  }));

  return NextResponse.json({ guests: formatted });
}
