import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { guestUpdateSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guest = await db.guest.findUnique({
    where: { id },
    include: {
      reservations: {
        include: { rooms: { include: { room: { include: { type: true } } } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }
  return NextResponse.json({ guest });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = guestUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await db.guest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const updated = await db.guest.update({
      where: { id },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        country: parsed.data.country || null,
        notes: parsed.data.notes || null,
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "GUEST_UPDATED",
        entity: "Guest",
        entityId: id,
        details: `Updated guest ${updated.firstName} ${updated.lastName}`,
      },
    });

    return NextResponse.json({ guest: updated });
  } catch (error) {
    console.error("Update guest error:", error);
    return NextResponse.json({ error: "Failed to update guest" }, { status: 500 });
  }
}
