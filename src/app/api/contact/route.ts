import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validators";
import { ApiError, apiError, parseBody } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const d = await parseBody(req, contactFormSchema);

    // Log the message (demo — no email service wired up yet).
    // P1: fields are now Zod-validated before we touch them.
    console.log("[Contact Form]", {
      name: d.name.trim(),
      email: d.email.trim(),
      phone: d.phone?.trim() || "(not provided)",
      message: d.message.trim(),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Message received",
    });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    return apiError(err);
  }
}
