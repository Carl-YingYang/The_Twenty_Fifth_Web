import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nightsBetween } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);

  if (!checkIn || !checkOut) {
    return NextResponse.json(
      { error: "checkIn and checkOut are required" },
      { status: 400 }
    );
  }

  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (co <= ci) {
    return NextResponse.json(
      { error: "Check-out must be after check-in" },
      { status: 400 }
    );
  }

  const nights = nightsBetween(ci, co);
  const totalGuests = adults + children;

  // All active rooms
  const rooms = await db.room.findMany({
    where: { isActive: true },
    include: {
      type: true,
      images: { orderBy: { sortOrder: "asc" } },
      amenities: { include: { amenity: true } },
    },
  });

  // Find overlapping reservations (not cancelled/rejected)
  const overlapping = await db.reservation.findMany({
    where: {
      status: { notIn: ["CANCELLED", "REJECTED"] },
      AND: [
        { checkIn: { lt: co } },
        { checkOut: { gt: ci } },
      ],
    },
    include: { rooms: true },
  });

  // Map roomId -> booked
  const bookedRoomIds = new Set<string>();
  for (const res of overlapping) {
    for (const rr of res.rooms) {
      bookedRoomIds.add(rr.roomId);
    }
  }

  // ── Check admin-blocked dates (Step 6: Block Dates feature) ──
  // A room with a blocked date range overlapping [ci, co) is unavailable.
  const blockedOverlaps = await db.blockedDate.findMany({
    where: {
      AND: [
        { startDate: { lt: co } },
        { endDate: { gt: ci } },
      ],
    },
    select: { roomId: true },
  });
  const blockedRoomIds = new Set(blockedOverlaps.map((b) => b.roomId));

  // Rooms in maintenance/blocked are not available
  const availableRooms = rooms
    .filter(
      (r) =>
        !bookedRoomIds.has(r.id) &&
        !blockedRoomIds.has(r.id) &&
        r.status !== "MAINTENANCE" &&
        r.status !== "BLOCKED" &&
        r.capacity >= totalGuests
    )
    .map((r) => ({
      ...r,
      amenities: r.amenities.map((ra) => ra.amenity),
      isAvailable: true,
      nights,
      totalPrice: r.pricePerNight * nights,
    }));

  const unavailableRooms = rooms
    .filter((r) => !availableRooms.find((a) => a.id === r.id))
    .map((r) => ({
      ...r,
      amenities: r.amenities.map((ra) => ra.amenity),
      isAvailable: false,
      nights,
      totalPrice: r.pricePerNight * nights,
    }));

  return NextResponse.json({
    checkIn,
    checkOut,
    nights,
    adults,
    children,
    available: availableRooms,
    unavailable: unavailableRooms,
    total: availableRooms.length,
  });
}
