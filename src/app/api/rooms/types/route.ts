import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/app/api/_lib/auth-helpers";
import { ApiError, apiError, parseBody } from "@/lib/api";
import { roomTypeCreateSchema } from "@/lib/validators";

// ============================================================
// /api/rooms/types — Room Type catalog (public GET, admin POST)
//
// P1 bugfix: POST previously used `roomCreateSchema` and created a Room
// (db.room.create) instead of a RoomType. This route is for creating
// room TYPES (e.g. "Beachfront Suite"), not individual rooms. Fixed to
// use `roomTypeCreateSchema` + `db.roomType.create`.
// ============================================================

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
  try {
    const user = await requireUser(req);

    // P1: strict Zod validation via parseBody (was using the wrong schema).
    const d = await parseBody(req, roomTypeCreateSchema);

    // Auto-generate slug from name if not provided.
    const slug =
      d.slug ??
      d.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    // Enforce uniqueness of name + slug (both @unique in schema).
    const existing = await db.roomType.findFirst({
      where: { OR: [{ name: d.name }, { slug }] },
    });
    if (existing) {
      throw new ApiError(409, "A room type with that name or slug already exists");
    }

    const roomType = await db.roomType.create({
      data: {
        name: d.name,
        slug,
        description: d.description,
        basePrice: d.basePrice,
        capacity: d.capacity,
        size: d.size ?? null,
        bedConfig: d.bedConfig || null,
      },
      include: { rooms: true },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "ROOM_TYPE_CREATED",
        entity: "RoomType",
        entityId: roomType.id,
        details: `Created room type ${roomType.name} (slug: ${roomType.slug})`,
      },
    });

    return NextResponse.json({ roomType }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("Create room type error:", err);
    return apiError(err);
  }
}
