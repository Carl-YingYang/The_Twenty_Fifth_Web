// ──────────────────────────────────────────────────────────────────────────
// API Response Helpers — standardize every route handler's output.
// P0 security: ensures consistent error envelopes so clients (and the
// admin UI) can reliably detect auth failures vs. server errors.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

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
