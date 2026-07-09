import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Lookup reservation by reference number + email
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const referenceNo = searchParams.get("referenceNo");
  const email = searchParams.get("email");

  if (!referenceNo || !email) {
    return NextResponse.json(
      { error: "Reference number and email are required" },
      { status: 400 }
    );
  }

  const reservation = await db.reservation.findFirst({
    where: {
      referenceNo: { equals: referenceNo },
      guest: { email: { equals: email } },
    },
    include: {
      guest: true,
      rooms: { include: { room: { include: { type: true, images: true } } } },
    },
  });

  if (!reservation) {
    return NextResponse.json(
      { error: "Reservation not found. Please check your reference number and email." },
      { status: 404 }
    );
  }

  return NextResponse.json({ reservation });
}
