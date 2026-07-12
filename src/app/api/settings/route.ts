import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError, apiError, parseBody } from "@/lib/api";
import { settingsUpdateSchema } from "@/lib/validators";

export async function GET() {
  const settings = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return NextResponse.json({ settings: map });
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, response } = await requireAuth(req);
    if (!user) return response!;

    // P1: strict Zod validation (was casting body without validation).
    const d = await parseBody(req, settingsUpdateSchema);

    // Upsert each setting in a transaction so a partial failure doesn't
    // leave the settings table half-updated.
    await db.$transaction(
      Object.entries(d.settings).map(([key, value]) =>
        db.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value, category: "GENERAL" },
        })
      )
    );

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "SETTINGS_UPDATED",
        entity: "Settings",
        details: `Updated ${Object.keys(d.settings).length} settings`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error("Update settings error:", err);
    return apiError(err);
  }
}
