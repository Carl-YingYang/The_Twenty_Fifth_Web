import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/app/api/_lib/auth-helpers";
import { ApiError, apiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    // P0 security: reports expose revenue + guest stats — admin/staff only.
    await requireUser(req);

    const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30"; // days

  const days = parseInt(range, 10);
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const [
    totalReservations,
    statusCounts,
    revenueAgg,
    totalRooms,
    occupiedRooms,
    mostBookedRoomRaw,
    monthlyReservations,
    guests,
    newGuestsThisMonth,
  ] = await Promise.all([
    db.reservation.count({ where: { createdAt: { gte: startDate } } }),
    db.reservation.groupBy({
      by: ["status"],
      where: { createdAt: { gte: startDate } },
      _count: { status: true },
    }),
    db.reservation.aggregate({
      where: {
        status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED"] },
        createdAt: { gte: startDate },
      },
      _sum: { totalAmount: true },
    }),
    db.room.count({ where: { isActive: true } }),
    db.room.count({ where: { isActive: true, status: "OCCUPIED" } }),
    db.reservationRoom.groupBy({
      by: ["roomId"],
      _count: { roomId: true },
      orderBy: { _count: { roomId: "desc" } },
      take: 1,
    }),
    db.reservation.findMany({
      where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) } },
      select: { checkIn: true, totalAmount: true, status: true },
    }),
    db.guest.count(),
    db.guest.count({
      where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const s of statusCounts) statusMap[s.status] = s._count.status;

  // Monthly data (last 12 months)
  const monthLabels: string[] = [];
  const monthlyData: { month: string; reservations: number; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthLabels.push(label);
    const monthRes = monthlyReservations.filter(
      (r) => r.checkIn >= new Date(d.getFullYear(), d.getMonth(), 1) && r.checkIn < new Date(d.getFullYear(), d.getMonth() + 1, 1)
    );
    monthlyData.push({
      month: label,
      reservations: monthRes.length,
      revenue: monthRes
        .filter((r) => ["CONFIRMED", "CHECKED_IN", "COMPLETED"].includes(r.status))
        .reduce((sum, r) => sum + r.totalAmount, 0),
    });
  }

  // Weekly data (last 8 weeks)
  const weeklyData: { week: string; reservations: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const count = monthlyReservations.filter(
      (r) => r.checkIn >= weekStart && r.checkIn < weekEnd
    ).length;
    weeklyData.push({
      week: `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      reservations: count,
    });
  }

  // Most booked room
  let mostBookedRoom: { name: string; count: number } | null = null;
  if (mostBookedRoomRaw.length > 0) {
    const room = await db.room.findUnique({
      where: { id: mostBookedRoomRaw[0].roomId },
      include: { type: true },
    });
    if (room) {
      mostBookedRoom = { name: `${room.name} (${room.number})`, count: mostBookedRoomRaw[0]._count.roomId };
    }
  }

  // Returning guests (guests with >1 reservation)
  const guestsWithReservations = await db.guest.findMany({
    select: { _count: { select: { reservations: true } } },
  });
  const returning = guestsWithReservations.filter((g) => g._count.reservations > 1).length;

  return NextResponse.json({
    totalReservations,
    confirmed: statusMap.CONFIRMED ?? 0,
    pending: statusMap.PENDING ?? 0,
    cancelled: statusMap.CANCELLED ?? 0,
    completed: statusMap.COMPLETED ?? 0,
    rejected: statusMap.REJECTED ?? 0,
    noShow: statusMap.NO_SHOW ?? 0,
    checkedIn: statusMap.CHECKED_IN ?? 0,
    totalRevenue: revenueAgg._sum.totalAmount ?? 0,
    occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    mostBookedRoom,
    monthlyData,
    weeklyData,
    guestStats: {
      total: guests,
      newThisMonth: newGuestsThisMonth,
      returning,
    },
  });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("Reports error:", err);
    return apiError(err);
  }
}
