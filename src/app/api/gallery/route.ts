import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { galleryCreateSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const where: Record<string, unknown> = { isActive: true };
  if (category && category !== "ALL") where.category = category;

  const gallery = await db.gallery.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ gallery });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  try {
    const body = await req.json();
    const parsed = galleryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const maxOrder = await db.gallery.aggregate({ _max: { sortOrder: true } });
    const item = await db.gallery.create({
      data: {
        ...parsed.data,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "GALLERY_ADDED",
        entity: "Gallery",
        entityId: item.id,
        details: `Added gallery item ${item.title}`,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Create gallery error:", error);
    return NextResponse.json({ error: "Failed to add gallery item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.gallery.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "GALLERY_DELETED",
        entity: "Gallery",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete gallery error:", error);
    return NextResponse.json({ error: "Failed to delete gallery item" }, { status: 500 });
  }
}
