import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError, apiError, parseBody } from "@/lib/api";
import { roomUpdateSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const room = await db.room.findUnique({
    where: { id },
    include: {
      type: true,
      images: { orderBy: { sortOrder: "asc" } },
      amenities: { include: { amenity: true } },
    },
  });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json({
    room: { ...room, amenities: room.amenities.map((ra) => ra.amenity) },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  try {
    const { id } = await params;
    // P1: strict Zod validation via parseBody (was destructuring raw body).
    const d = await parseBody(req, roomUpdateSchema);

    const existing = await db.room.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Room not found");
    }

    const {
      number,
      name,
      description,
      floor,
      view,
      pricePerNight,
      capacity,
      status,
      typeId,
      isActive,
      amenityIds,
      imageUrls,
    } = d;

    if (number && number !== existing.number) {
      const dup = await db.room.findUnique({ where: { number } });
      if (dup) {
        throw new ApiError(409, "Room number already exists");
      }
    }

    if (amenityIds !== undefined) {
      await db.roomAmenity.deleteMany({ where: { roomId: id } });
      if (Array.isArray(amenityIds) && amenityIds.length > 0) {
        await db.roomAmenity.createMany({
          data: amenityIds.map((amenityId: string) => ({ roomId: id, amenityId })),
        });
      }
    }

    if (imageUrls !== undefined) {
      await db.roomImage.deleteMany({ where: { roomId: id } });
      if (Array.isArray(imageUrls) && imageUrls.length > 0) {
        await db.roomImage.createMany({
          data: imageUrls.map(
            (img: { url: string; altText?: string; isPrimary?: boolean }, i: number) => ({
              roomId: id,
              url: img.url,
              altText: img.altText ?? null,
              isPrimary: img.isPrimary ?? i === 0,
              sortOrder: i,
            })
          ),
        });
      }
    }

    const updated = await db.room.update({
      where: { id },
      data: {
        ...(number !== undefined ? { number } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(floor !== undefined ? { floor } : {}),
        ...(view !== undefined ? { view } : {}),
        ...(pricePerNight !== undefined ? { pricePerNight } : {}),
        ...(capacity !== undefined ? { capacity } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(typeId !== undefined ? { typeId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: { type: true, images: { orderBy: { sortOrder: "asc" } }, amenities: { include: { amenity: true } } },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "ROOM_UPDATED",
        entity: "Room",
        entityId: id,
        details: `Updated room ${updated.number}`,
      },
    });

    return NextResponse.json({ room: { ...updated, amenities: updated.amenities.map((ra) => ra.amenity) } });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("Update room error:", err);
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  try {
    const { id } = await params;
    const existing = await db.room.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Soft delete
    await db.room.update({ where: { id }, data: { isActive: false } });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "ROOM_DELETED",
        entity: "Room",
        entityId: id,
        details: `Deactivated room ${existing.number}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}
