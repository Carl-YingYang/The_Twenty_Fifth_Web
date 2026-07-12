import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/app/api/_lib/auth-helpers";
import { ApiError, apiError, parseBody } from "@/lib/api";
import { roomCreateSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const typeSlug = searchParams.get("type");
  const status = searchParams.get("status");

  const rooms = await db.room.findMany({
    where: {
      isActive: true,
      ...(typeSlug ? { type: { slug: typeSlug } } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      type: true,
      images: { orderBy: { sortOrder: "asc" } },
      amenities: { include: { amenity: true } },
    },
    orderBy: [{ type: { name: "asc" } }, { number: "asc" }],
  });

  const formatted = rooms.map((r) => ({
    ...r,
    amenities: r.amenities.map((ra) => ra.amenity),
  }));

  return NextResponse.json({ rooms: formatted });
}

// POST — create a new room (admin only).
// Fixes the 405 Method Not Allowed error when the admin saves a new room.
// Body is validated against roomCreateSchema (Zod) — see src/lib/validators.ts.
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireRole(req, "ADMIN");

    const d = await parseBody(req, roomCreateSchema);

    // ── Validate typeId references an existing RoomType ──
    const roomType = await db.roomType.findUnique({ where: { id: d.typeId } });
    if (!roomType) {
      throw new ApiError(400, "Selected room type does not exist");
    }

    // ── Validate room number is unique ──
    const existing = await db.room.findUnique({ where: { number: d.number } });
    if (existing) {
      throw new ApiError(409, `Room number "${d.number}" already exists`);
    }

    // ── Create the room + images + amenities in one transaction ──
    const room = await db.$transaction(async (tx) => {
      const created = await tx.room.create({
        data: {
          number: d.number,
          name: d.name,
          description: d.description,
          floor: d.floor ?? null,
          view: d.view || null,
          pricePerNight: d.pricePerNight,
          capacity: d.capacity,
          status: d.status,
          typeId: d.typeId,
          // Inline-create images if provided (imageUrls come from /api/upload)
          ...(d.imageUrls && d.imageUrls.length > 0
            ? {
                images: {
                  create: d.imageUrls.map(
                    (img: { url: string; altText?: string; isPrimary?: boolean }, i: number) => ({
                      url: img.url,
                      altText: img.altText ?? null,
                      isPrimary: img.isPrimary ?? i === 0,
                      sortOrder: i,
                    })
                  ),
                },
              }
            : {}),
        },
        include: {
          type: true,
          images: { orderBy: { sortOrder: "asc" } },
          amenities: { include: { amenity: true } },
        },
      });

      // Link amenities if provided
      if (d.amenityIds && d.amenityIds.length > 0) {
        await tx.roomAmenity.createMany({
          data: d.amenityIds.map((amenityId: string) => ({
            roomId: created.id,
            amenityId,
          })),
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "ROOM_CREATED",
          entity: "Room",
          entityId: created.id,
          details: `Created room ${created.number} (${created.name})`,
        },
      });

      return created;
    });

    // Re-fetch to include the amenities we just linked
    const fullRoom = await db.room.findUnique({
      where: { id: room.id },
      include: {
        type: true,
        images: { orderBy: { sortOrder: "asc" } },
        amenities: { include: { amenity: true } },
      },
    });

    return NextResponse.json(
      {
        room: {
          ...fullRoom,
          amenities: fullRoom?.amenities.map((ra) => ra.amenity) ?? [],
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("Create room error:", err);
    return apiError(err);
  }
}
