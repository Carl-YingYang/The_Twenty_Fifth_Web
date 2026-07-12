// ──────────────────────────────────────────────────────────────────────────
// API Response Helpers — standardize every route handler's output.
// P0 security: ensures consistent error envelopes so clients (and the
// admin UI) can reliably detect auth failures vs. server errors.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

/**
 * Custom error class for API routes. Throw this from anywhere inside a
 * route handler (or a service layer) and the global catch can convert it
 * to a JSON response via `apiError(err)`.
 */
export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

/**
 * Success envelope: `{ success: true, data }`.
 * Defaults to 200 OK. Pass an explicit status for 201 / 202 etc.
 */
export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Error envelope: `{ success: false, error: message }`.
 * Accepts either an `ApiError` instance, a regular Error, or a string.
 * Defaults to 500 if no recognizable status is supplied.
 */
export function apiError(error: unknown, status?: number) {
  let code = status ?? 500;
  let message = "Internal server error";

  if (error instanceof ApiError) {
    code = error.statusCode;
    message = error.message;
  } else if (error instanceof Error) {
    // Never leak internal error text for unexpected errors — keep the
    // generic message unless the caller provided an explicit status.
    if (status === undefined) {
      code = 500;
      message = "Internal server error";
    } else {
      message = error.message;
    }
  } else if (typeof error === "string") {
    message = error;
  }

  return NextResponse.json({ success: false, error: message }, { status: code });
}

/**
 * Parse + validate a request body against a Zod schema. Throws ApiError(400)
 * on validation failure so the route's existing catch converts it to a clean
 * 400 response with the formatted Zod issues.
 *
 * Usage:
 *   const d = await parseBody(req, roomCreateSchema);
 */
export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
  try {
    return schema.parse(json);
  } catch (err) {
    if (err instanceof ZodError) {
      // Flatten the first issue into a readable message. Full issues array
      // is available on the error but we keep the envelope simple.
      const first = err.issues[0];
      const path = first?.path?.length ? ` (${first.path.join(".")})` : "";
      throw new ApiError(400, `${first?.message ?? "Invalid input"}${path}`);
    }
    throw new ApiError(400, "Invalid input");
  }
}
