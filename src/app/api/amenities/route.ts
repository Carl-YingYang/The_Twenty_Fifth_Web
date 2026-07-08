import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { amenityCreateSchema } from "@/lib/validators";

export async function GET() {
  const amenities = await db.amenity.findMany({
    include: { rooms: { select: { roomId: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const formatted = amenities.map((a) => ({
    ...a,
    roomCount: a.rooms.length,
    rooms: undefined,
  }));
  return NextResponse.json({ amenities: formatted });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  try {
    const body = await req.json();
    const parsed = amenityCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const slug = d.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existing = await db.amenity.findFirst({ where: { OR: [{ name: d.name }, { slug }] } });
    if (existing) {
      return NextResponse.json({ error: "Amenity already exists" }, { status: 409 });
    }

    const amenity = await db.amenity.create({
      data: { name: d.name, slug, icon: d.icon || null, category: d.category, description: d.description || null },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "AMENITY_CREATED",
        entity: "Amenity",
        entityId: amenity.id,
        details: `Created amenity ${amenity.name}`,
      },
    });

    return NextResponse.json({ amenity }, { status: 201 });
  } catch (error) {
    console.error("Create amenity error:", error);
    return NextResponse.json({ error: "Failed to create amenity" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.amenity.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "AMENITY_DELETED",
        entity: "Amenity",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete amenity error:", error);
    return NextResponse.json({ error: "Failed to delete amenity" }, { status: 500 });
  }
}
