import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTool, type ToolArgs } from "@/lib/admin-copilot-tools";
import { ApiError, apiError, parseBody } from "@/lib/api";
import { toolExecuteSchema } from "@/lib/validators";

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
  try {
    const { user, response } = await requireAuth(req);
    if (!user) return response!;

    // P1: strict Zod validation of the { tool, args } envelope.
    const d = await parseBody(req, toolExecuteSchema);
    const { tool, args } = d;

    const toolDef = getTool(tool);
    if (!toolDef) {
      throw new ApiError(400, `Unknown tool "${tool}". Action rejected.`);
    }

    // Normalize args into a string→string record.
    const cleanArgs: ToolArgs = {};
    if (args && typeof args === "object" && !Array.isArray(args)) {
      for (const [k, v] of Object.entries(args)) {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          cleanArgs[k] = String(v);
        }
      }
    }

    // Server-side re-validation (never trust the client).
    const validationError = toolDef.validate(cleanArgs);
    if (validationError) {
      throw new ApiError(400, validationError);
    }

    // Confirm all required args are present.
    for (const reqArg of toolDef.requiredArgs) {
      if (!cleanArgs[reqArg]?.trim()) {
        throw new ApiError(400, `Missing required argument: ${reqArg}.`);
      }
    }

    const result = await toolDef.run(cleanArgs, user, req);
    return NextResponse.json({
      ok: result.success,
      message: result.message,
      data: result.data ?? null,
      tool: toolDef.name,
      label: toolDef.label,
    });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err, err.statusCode);
    console.error(
      `[/api/admin/chat/execute] tool threw:`,
      (err as Error)?.message
    );
    return apiError(err);
  }
}
