import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
