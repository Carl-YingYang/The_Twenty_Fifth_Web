import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { roomCreateSchema } from "@/lib/validators";

export async function GET() {
  const roomTypes = await db.roomType.findMany({
    include: {
      rooms: {
        where: { isActive: true },
        select: { id: true, number: true, name: true, status: true, pricePerNight: true },
      },
    },
    orderBy: { basePrice: "asc" },
  });
  return NextResponse.json({ roomTypes });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  try {
    const body = await req.json();
    const parsed = roomCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const d = parsed.data;

    const existing = await db.room.findUnique({ where: { number: d.number } });
    if (existing) {
      return NextResponse.json(
        { error: "Room number already exists" },
        { status: 409 }
      );
    }

    const room = await db.room.create({
      data: {
        number: d.number,
        name: d.name,
        description: d.description,
        floor: d.floor ?? null,
        view: d.view ?? null,
        pricePerNight: d.pricePerNight,
        capacity: d.capacity,
        status: d.status,
        typeId: d.typeId,
        images: d.imageUrls?.length
          ? {
              create: d.imageUrls.map((img, i) => ({
                url: img.url,
                altText: img.altText ?? null,
                isPrimary: img.isPrimary ?? i === 0,
                sortOrder: i,
              })),
            }
          : undefined,
        amenities: d.amenityIds?.length
          ? { create: d.amenityIds.map((amenityId) => ({ amenityId })) }
          : undefined,
      },
      include: { type: true, images: true, amenities: { include: { amenity: true } } },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "ROOM_CREATED",
        entity: "Room",
        entityId: room.id,
        details: `Created room ${room.number} (${room.name})`,
      },
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
