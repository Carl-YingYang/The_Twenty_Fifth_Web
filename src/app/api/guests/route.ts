import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/app/api/_lib/auth-helpers";
import { ApiError, apiError } from "@/lib/api";

// GET — list/search guests.
// P0 security: exposes guest PII (name, email, phone, address) → admin/staff only.
export async function GET(req: NextRequest) {
  try {
    await requireUser(req);

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
        reservations: {
          select: {
            id: true,
            status: true,
            referenceNo: true,
            checkIn: true,
            checkOut: true,
          },
        },
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
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("List guests error:", err);
    return apiError(err);
  }
}
