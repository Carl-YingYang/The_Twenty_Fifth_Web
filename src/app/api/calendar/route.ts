import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  const start = startDate ? new Date(startDate) : new Date(new Date().toDateString());
  const end = endDate
    ? new Date(endDate)
    : new Date(start.getTime() + 13 * 86400000); // 14 days default
  end.setHours(23, 59, 59, 999);

  const rooms = await db.room.findMany({
    where: { isActive: true },
    include: { type: true },
    orderBy: [{ type: { name: "asc" } }, { number: "asc" }],
  });

  // Fetch reservations in the date window
  const reservations = await db.reservation.findMany({
    where: {
      status: { notIn: ["CANCELLED", "REJECTED"] },
      AND: [
        { checkIn: { lt: end } },
        { checkOut: { gt: start } },
      ],
    },
    include: {
      guest: true,
      rooms: true,
    },
  });

  // Build calendar: for each room, for each day, what's the status?
  const days: { date: Date; label: string }[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    days.push({
      date: new Date(cursor),
      label: cursor.toISOString().split("T")[0],
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // room statuses (maintenance/blocked) — use the room.status at the start
  const calendar = rooms.map((room) => {
    const cells = days.map((day) => {
      // Check room maintenance/block — for MVP, treat static room status
      let status: "AVAILABLE" | "RESERVED" | "OCCUPIED" | "CLEANING" | "MAINTENANCE" | "BLOCKED" = "AVAILABLE";

      if (room.status === "MAINTENANCE") {
        status = "MAINTENANCE";
      } else if (room.status === "BLOCKED") {
        status = "BLOCKED";
      }

      const dayStart = new Date(day.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day.date);
      dayEnd.setHours(23, 59, 59, 999);

      // Find a reservation covering this day for this room
      const res = reservations.find(
        (r) =>
          r.rooms.some((rr) => rr.roomId === room.id) &&
          r.checkIn <= dayEnd &&
          r.checkOut > dayStart
      );

      if (res) {
        // If check-in day and checked in → occupied
        if (res.checkIn.toDateString() === day.date.toDateString()) {
          status = res.status === "CHECKED_IN" || res.status === "COMPLETED" ? "OCCUPIED" : "RESERVED";
        } else if (res.checkOut.toDateString() === day.date.toDateString()) {
          // checkout day — still occupied until checkout
          status = res.status === "CHECKED_IN" || res.status === "COMPLETED" ? "OCCUPIED" : "RESERVED";
        } else {
          status = res.status === "CHECKED_IN" || res.status === "COMPLETED" ? "OCCUPIED" : "RESERVED";
        }

        return {
          roomId: room.id,
          roomNumber: room.number,
          roomName: room.name,
          date: day.label,
          status,
          reservationId: res.id,
          referenceNo: res.referenceNo,
          guestName: `${res.guest.firstName} ${res.guest.lastName}`,
        };
      }

      // Check cleaning: only show CLEANING on the checkout day of a just-completed reservation.
      // A room in "CLEANING" static status should only display as cleaning on days where
      // a checkout just happened (reservation with COMPLETED status whose checkout == this day).
      // All other days should be AVAILABLE (the room isn't being cleaned all week).
      if (status === "AVAILABLE") {
        const checkoutRes = reservations.find(
          (r) =>
            r.rooms.some((rr) => rr.roomId === room.id) &&
            r.checkOut.toDateString() === day.date.toDateString() &&
            (r.status === "COMPLETED" || r.status === "CANCELLED" || r.status === "NO_SHOW")
        );
        if (checkoutRes) {
          status = "CLEANING";
        }
      }

      return {
        roomId: room.id,
        roomNumber: room.number,
        roomName: room.name,
        date: day.label,
        status,
      };
    });

    return {
      room: {
        id: room.id,
        number: room.number,
        name: room.name,
        type: room.type?.name ?? "Room",
        capacity: room.capacity,
      },
      cells,
    };
  });

  return NextResponse.json({
    days: days.map((d) => ({ date: d.label, day: d.date.getDate(), weekday: d.date.toLocaleDateString("en-US", { weekday: "short" }), isToday: d.date.toDateString() === new Date().toDateString() })),
    calendar,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });
}
