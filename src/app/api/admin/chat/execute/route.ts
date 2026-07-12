import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTool, type ToolArgs } from "@/lib/admin-copilot-tools";

// ============================================================
// /api/admin/chat/execute — Controlled action execution
//
// The admin clicked "Approve" on an action card that Aria proposed.
// This endpoint:
//   1. Re-authenticates the admin.
//   2. Looks up the tool in the registry (whitelist — unknown tools
//      are rejected outright).
//   3. Re-validates the args server-side (the client is never
//      trusted).
//   4. Runs the handler, which performs the real DB mutation and
//      writes its own AuditLog entry.
//   5. Returns the result so the UI can update the action card.
//
// Nothing the AI proposed can execute without passing through here.
// ============================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  let body: { tool?: unknown; args?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { tool, args } = body;
  if (typeof tool !== "string" || !tool.trim()) {
    return NextResponse.json({ error: "Missing tool name." }, { status: 400 });
  }

  const toolDef = getTool(tool);
  if (!toolDef) {
    return NextResponse.json(
      { error: `Unknown tool "${tool}". Action rejected.` },
      { status: 400 }
    );
  }

  // Normalize args into a string→string record.
  const cleanArgs: ToolArgs = {};
  if (args && typeof args === "object" && !Array.isArray(args)) {
    for (const [k, v] of Object.entries(args as Record<string, unknown>)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        cleanArgs[k] = String(v);
      }
    }
  }

  // Server-side re-validation (never trust the client).
  const validationError = toolDef.validate(cleanArgs);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Confirm all required args are present.
  for (const reqArg of toolDef.requiredArgs) {
    if (!cleanArgs[reqArg]?.trim()) {
      return NextResponse.json(
        { error: `Missing required argument: ${reqArg}.` },
        { status: 400 }
      );
    }
  }

  try {
    const result = await toolDef.run(cleanArgs, user, req);
    return NextResponse.json({
      ok: result.success,
      message: result.message,
      data: result.data ?? null,
      tool: toolDef.name,
      label: toolDef.label,
    });
  } catch (err) {
    console.error(
      `[/api/admin/chat/execute] tool "${tool}" threw:`,
      (err as Error)?.message
    );
    return NextResponse.json(
      { error: "The action failed to execute. Please try again or do it manually." },
      { status: 500 }
    );
  }
}
