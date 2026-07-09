import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const today = new Date();
  const todayStr = new Date(today.toDateString());
  const tomorrow = new Date(todayStr);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalRooms,
    availableRooms,
    occupiedRooms,
    pendingReservations,
    arrivalsToday,
    departuresToday,
    recentBookings,
    confirmedTodayRevenue,
  ] = await Promise.all([
    db.room.count({ where: { isActive: true } }),
    db.room.count({ where: { isActive: true, status: "AVAILABLE" } }),
    db.room.count({ where: { isActive: true, status: "OCCUPIED" } }),
    db.reservation.count({ where: { status: "PENDING" } }),
    db.reservation.findMany({
      where: {
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
        checkIn: { gte: todayStr, lt: tomorrow },
      },
      include: {
        guest: true,
        rooms: { include: { room: { include: { type: true } } } },
      },
      orderBy: { checkIn: "asc" },
    }),
    db.reservation.findMany({
      where: {
        status: { in: ["CHECKED_IN", "COMPLETED"] },
        checkOut: { gte: todayStr, lt: tomorrow },
      },
      include: {
        guest: true,
        rooms: { include: { room: { include: { type: true } } } },
      },
      orderBy: { checkOut: "asc" },
    }),
    db.reservation.findMany({
      include: {
        guest: true,
        rooms: { include: { room: { include: { type: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.reservation.aggregate({
      where: {
        status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED"] },
        confirmedAt: { gte: todayStr, lt: tomorrow },
      },
      _sum: { totalAmount: true },
    }),
  ]);

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return NextResponse.json({
    arrivalsToday: arrivalsToday.length,
    departuresToday: departuresToday.length,
    pendingReservations,
    availableRooms,
    occupiedRooms,
    totalRooms,
    occupancyRate,
    revenueToday: confirmedTodayRevenue._sum.totalAmount ?? 0,
    recentBookings,
    todayTimeline: { arrivals: arrivalsToday, departures: departuresToday },
  });
}
