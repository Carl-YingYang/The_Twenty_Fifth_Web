import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { User } from "@/types";

// ============================================================
// Admin Copilot ("Aria") — Controlled Automation Tool Registry
//
// Every "write" tool here is an action the AI may PROPOSE. The
// admin must explicitly approve it in the UI before it executes.
// Each tool has:
//   - a Zod-style arg validator (hand-rolled to avoid pulling zod
//     into this lib at runtime; the execute route also re-validates)
//   - a human-readable summary for the confirmation card
//   - a server-side handler that performs the real DB mutation and
//     writes an AuditLog entry
//
// Read-only questions are answered directly in chat — they do NOT
// go through this registry.
// ============================================================

export interface ToolArgs {
  [key: string]: string;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface AdminTool {
  name: string;
  label: string; // short label for the confirmation card
  description: string; // shown to the AI in the system prompt
  destructive: boolean;
  requiredArgs: string[]; // arg keys that must be present & non-empty
  /** Build a human-readable summary of what will happen, for the approve card. */
  summarize: (args: ToolArgs) => string;
  /** Validate args. Return null if OK, or an error message. */
  validate: (args: ToolArgs) => string | null;
  /** Execute the action server-side. */
  run: (args: ToolArgs, user: User, req: NextRequest) => Promise<ToolResult>;
}

// ---------- Booking status transitions (mirrors reservations API) ----------
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  NO_SHOW: [],
};

async function findReservationByReference(referenceNo: string) {
  return db.reservation.findFirst({
    where: { referenceNo: { equals: referenceNo, mode: "insensitive" } },
    include: {
      guest: true,
      rooms: { include: { room: { include: { type: true } } } },
    },
  });
}

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================================
// Tool definitions
// ============================================================

const confirmBooking: AdminTool = {
  name: "confirm_booking",
  label: "Confirm booking",
  description:
    "Confirm a PENDING reservation so the guest's dates are locked in. Moves status PENDING → CONFIRMED and marks the reserved rooms as RESERVED. Args: referenceNo (the booking reference, e.g. TTF-2026-XXXXXX).",
  destructive: false,
  requiredArgs: ["referenceNo"],
  summarize: (a) => `Confirm reservation ${a.referenceNo} (PENDING → CONFIRMED)`,
  validate: (a) =>
    !a.referenceNo?.trim() ? "Missing referenceNo." : null,
  run: async (a, user) => {
    const r = await findReservationByReference(a.referenceNo);
    if (!r) return { success: false, message: `No reservation found with reference ${a.referenceNo}.` };
    if (!VALID_TRANSITIONS[r.status]?.includes("CONFIRMED")) {
      return { success: false, message: `Reservation ${r.referenceNo} is currently ${r.status} and cannot be confirmed.` };
    }
    const now = new Date();
    const updated = await db.reservation.update({
      where: { id: r.id },
      data: { status: "CONFIRMED", confirmedAt: now },
    });
    for (const rr of r.rooms) {
      await db.room.update({ where: { id: rr.roomId }, data: { status: "RESERVED" } });
    }
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "RESERVATION_CONFIRMED",
        entity: "Reservation",
        entityId: r.id,
        details: `${r.referenceNo}: PENDING → CONFIRMED (via Aria copilot)`,
      },
    });
    await db.notification.create({
      data: {
        title: "Booking confirmed",
        message: `${r.referenceNo} for ${r.guest.firstName} ${r.guest.lastName} was confirmed by ${user.name} via Aria.`,
        type: "BOOKING",
        link: null,
      },
    });
    return {
      success: true,
      message: `Confirmed ${updated.referenceNo} for ${r.guest.firstName} ${r.guest.lastName}. Rooms marked as RESERVED.`,
      data: { referenceNo: updated.referenceNo, status: updated.status },
    };
  },
};

const rejectBooking: AdminTool = {
  name: "reject_booking",
  label: "Reject booking",
  description:
    "Reject a PENDING reservation (e.g. dates not available). Moves status PENDING → REJECTED and releases the held rooms back to AVAILABLE. Destructive. Args: referenceNo, reason (required — explain why).",
  destructive: true,
  requiredArgs: ["referenceNo", "reason"],
  summarize: (a) =>
    `Reject reservation ${a.referenceNo} — reason: "${a.reason}"`,
  validate: (a) => {
    if (!a.referenceNo?.trim()) return "Missing referenceNo.";
    if (!a.reason?.trim()) return "A reason is required to reject a booking.";
    return null;
  },
  run: async (a, user) => {
    const r = await findReservationByReference(a.referenceNo);
    if (!r) return { success: false, message: `No reservation found with reference ${a.referenceNo}.` };
    if (!VALID_TRANSITIONS[r.status]?.includes("REJECTED")) {
      return { success: false, message: `Reservation ${r.referenceNo} is currently ${r.status} and cannot be rejected.` };
    }
    const updated = await db.reservation.update({
      where: { id: r.id },
      data: { status: "REJECTED", rejectedReason: a.reason },
    });
    for (const rr of r.rooms) {
      const room = await db.room.findUnique({ where: { id: rr.roomId } });
      if (room && room.status === "RESERVED") {
        await db.room.update({ where: { id: rr.roomId }, data: { status: "AVAILABLE" } });
      }
    }
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "RESERVATION_REJECTED",
        entity: "Reservation",
        entityId: r.id,
        details: `${r.referenceNo}: PENDING → REJECTED — ${a.reason} (via Aria copilot)`,
      },
    });
    return {
      success: true,
      message: `Rejected ${updated.referenceNo}. Reason: "${a.reason}". Held rooms released.`,
      data: { referenceNo: updated.referenceNo, status: updated.status },
    };
  },
};

const checkInGuest: AdminTool = {
  name: "check_in_guest",
  label: "Check-in guest",
  description:
    "Check a guest in to the resort. Moves a CONFIRMED reservation → CHECKED_IN and marks its rooms as OCCUPIED. Args: referenceNo.",
  destructive: false,
  requiredArgs: ["referenceNo"],
  summarize: (a) => `Check in guest for reservation ${a.referenceNo}`,
  validate: (a) => (!a.referenceNo?.trim() ? "Missing referenceNo." : null),
  run: async (a, user) => {
    const r = await findReservationByReference(a.referenceNo);
    if (!r) return { success: false, message: `No reservation found with reference ${a.referenceNo}.` };
    if (!VALID_TRANSITIONS[r.status]?.includes("CHECKED_IN")) {
      return { success: false, message: `Reservation ${r.referenceNo} is currently ${r.status} and cannot be checked in.` };
    }
    const now = new Date();
    const updated = await db.reservation.update({
      where: { id: r.id },
      data: { status: "CHECKED_IN", checkedInAt: now },
    });
    for (const rr of r.rooms) {
      await db.room.update({ where: { id: rr.roomId }, data: { status: "OCCUPIED" } });
    }
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "RESERVATION_CHECKED_IN",
        entity: "Reservation",
        entityId: r.id,
        details: `${r.referenceNo}: CONFIRMED → CHECKED_IN (via Aria copilot)`,
      },
    });
    return {
      success: true,
      message: `Checked in ${r.guest.firstName} ${r.guest.lastName} (${updated.referenceNo}). Rooms now OCCUPIED.`,
      data: { referenceNo: updated.referenceNo, status: updated.status },
    };
  },
};

const checkOutGuest: AdminTool = {
  name: "check_out_guest",
  label: "Check-out guest",
  description:
    "Check a guest out of the resort. Moves a CHECKED_IN reservation → COMPLETED and sets its rooms to CLEANING. Args: referenceNo.",
  destructive: false,
  requiredArgs: ["referenceNo"],
  summarize: (a) => `Check out guest for reservation ${a.referenceNo}`,
  validate: (a) => (!a.referenceNo?.trim() ? "Missing referenceNo." : null),
  run: async (a, user) => {
    const r = await findReservationByReference(a.referenceNo);
    if (!r) return { success: false, message: `No reservation found with reference ${a.referenceNo}.` };
    if (!VALID_TRANSITIONS[r.status]?.includes("COMPLETED")) {
      return { success: false, message: `Reservation ${r.referenceNo} is currently ${r.status} and cannot be checked out.` };
    }
    const now = new Date();
    const updated = await db.reservation.update({
      where: { id: r.id },
      data: { status: "COMPLETED", checkedOutAt: now },
    });
    for (const rr of r.rooms) {
      await db.room.update({ where: { id: rr.roomId }, data: { status: "CLEANING" } });
    }
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "RESERVATION_COMPLETED",
        entity: "Reservation",
        entityId: r.id,
        details: `${r.referenceNo}: CHECKED_IN → COMPLETED (via Aria copilot)`,
      },
    });
    return {
      success: true,
      message: `Checked out ${r.guest.firstName} ${r.guest.lastName} (${updated.referenceNo}). Rooms now CLEANING.`,
      data: { referenceNo: updated.referenceNo, status: updated.status },
    };
  },
};

const cancelBooking: AdminTool = {
  name: "cancel_booking",
  label: "Cancel booking",
  description:
    "Cancel an existing reservation (guest cancellation or host-initiated). Works from PENDING or CONFIRMED. Releases held rooms. Destructive. Args: referenceNo, reason (required).",
  destructive: true,
  requiredArgs: ["referenceNo", "reason"],
  summarize: (a) => `Cancel reservation ${a.referenceNo} — reason: "${a.reason}"`,
  validate: (a) => {
    if (!a.referenceNo?.trim()) return "Missing referenceNo.";
    if (!a.reason?.trim()) return "A reason is required to cancel a booking.";
    return null;
  },
  run: async (a, user) => {
    const r = await findReservationByReference(a.referenceNo);
    if (!r) return { success: false, message: `No reservation found with reference ${a.referenceNo}.` };
    if (!VALID_TRANSITIONS[r.status]?.includes("CANCELLED")) {
      return { success: false, message: `Reservation ${r.referenceNo} is currently ${r.status} and cannot be cancelled.` };
    }
    const now = new Date();
    const updated = await db.reservation.update({
      where: { id: r.id },
      data: { status: "CANCELLED", cancelledAt: now, rejectedReason: a.reason },
    });
    for (const rr of r.rooms) {
      await db.room.update({ where: { id: rr.roomId }, data: { status: "CLEANING" } });
    }
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "RESERVATION_CANCELLED",
        entity: "Reservation",
        entityId: r.id,
        details: `${r.referenceNo}: ${r.status} → CANCELLED — ${a.reason} (via Aria copilot)`,
      },
    });
    return {
      success: true,
      message: `Cancelled ${updated.referenceNo}. Reason: "${a.reason}".`,
      data: { referenceNo: updated.referenceNo, status: updated.status },
    };
  },
};

const markNoShow: AdminTool = {
  name: "mark_no_show",
  label: "Mark no-show",
  description:
    "Mark a CONFIRMED reservation as a no-show (guest didn't arrive). Moves CONFIRMED → NO_SHOW and releases rooms. Destructive. Args: referenceNo.",
  destructive: true,
  requiredArgs: ["referenceNo"],
  summarize: (a) => `Mark reservation ${a.referenceNo} as NO_SHOW`,
  validate: (a) => (!a.referenceNo?.trim() ? "Missing referenceNo." : null),
  run: async (a, user) => {
    const r = await findReservationByReference(a.referenceNo);
    if (!r) return { success: false, message: `No reservation found with reference ${a.referenceNo}.` };
    if (!VALID_TRANSITIONS[r.status]?.includes("NO_SHOW")) {
      return { success: false, message: `Reservation ${r.referenceNo} is currently ${r.status} and cannot be marked as no-show.` };
    }
    const updated = await db.reservation.update({
      where: { id: r.id },
      data: { status: "NO_SHOW" },
    });
    for (const rr of r.rooms) {
      await db.room.update({ where: { id: rr.roomId }, data: { status: "CLEANING" } });
    }
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "RESERVATION_NO_SHOW",
        entity: "Reservation",
        entityId: r.id,
        details: `${r.referenceNo}: CONFIRMED → NO_SHOW (via Aria copilot)`,
      },
    });
    return {
      success: true,
      message: `Marked ${updated.referenceNo} as NO_SHOW. Rooms released to CLEANING.`,
      data: { referenceNo: updated.referenceNo, status: updated.status },
    };
  },
};

const ROOM_STATUSES = ["AVAILABLE", "RESERVED", "OCCUPIED", "CLEANING", "MAINTENANCE", "BLOCKED"];

const setRoomStatus: AdminTool = {
  name: "set_room_status",
  label: "Update room status",
  description:
    "Change a room's operational status (e.g. mark it CLEANING after turnover, or MAINTENANCE if something is broken). Args: roomNumber (e.g. 'V-01'), status (one of AVAILABLE, RESERVED, OCCUPIED, CLEANING, MAINTENANCE, BLOCKED).",
  destructive: false,
  requiredArgs: ["roomNumber", "status"],
  summarize: (a) => `Set room ${a.roomNumber} → ${a.status}`,
  validate: (a) => {
    if (!a.roomNumber?.trim()) return "Missing roomNumber.";
    if (!a.status?.trim()) return "Missing status.";
    if (!ROOM_STATUSES.includes(a.status.toUpperCase())) {
      return `Status must be one of: ${ROOM_STATUSES.join(", ")}.`;
    }
    return null;
  },
  run: async (a, user) => {
    const room = await db.room.findFirst({
      where: { number: { equals: a.roomNumber, mode: "insensitive" } },
      include: { type: true },
    });
    if (!room) return { success: false, message: `No room found with number ${a.roomNumber}.` };
    const newStatus = a.status.toUpperCase();
    const updated = await db.room.update({
      where: { id: room.id },
      data: { status: newStatus },
    });
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: `ROOM_STATUS_${newStatus}`,
        entity: "Room",
        entityId: room.id,
        details: `${room.number} (${room.name}): ${room.status} → ${newStatus} (via Aria copilot)`,
      },
    });
    return {
      success: true,
      message: `Room ${updated.number} (${updated.name}) is now ${newStatus}.`,
      data: { roomNumber: updated.number, status: updated.status },
    };
  },
};

const addGuestNote: AdminTool = {
  name: "add_guest_note",
  label: "Add guest note",
  description:
    "Append a staff note to a guest's profile (e.g. 'VIP — prefers high floor', 'allergic to shellfish'). The note is prepended to existing notes with a timestamp. Args: guestEmail, note.",
  destructive: false,
  requiredArgs: ["guestEmail", "note"],
  summarize: (a) => `Add note to ${a.guestEmail}: "${a.note}"`,
  validate: (a) => {
    if (!a.guestEmail?.trim()) return "Missing guestEmail.";
    if (!a.note?.trim()) return "Missing note.";
    return null;
  },
  run: async (a, user) => {
    const guest = await db.guest.findFirst({
      where: { email: { equals: a.guestEmail, mode: "insensitive" } },
    });
    if (!guest) return { success: false, message: `No guest found with email ${a.guestEmail}.` };
    const stamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const entry = `[${stamp} · ${user.name}] ${a.note}`;
    const merged = guest.notes ? `${entry}\n${guest.notes}` : entry;
    const updated = await db.guest.update({
      where: { id: guest.id },
      data: { notes: merged },
    });
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "GUEST_NOTE_ADDED",
        entity: "Guest",
        entityId: guest.id,
        details: `Note added to ${guest.firstName} ${guest.lastName} (${guest.email}) via Aria copilot: ${a.note}`,
      },
    });
    return {
      success: true,
      message: `Note added to ${updated.firstName} ${updated.lastName}'s profile.`,
      data: { guestId: updated.id },
    };
  },
};

const createNotification: AdminTool = {
  name: "create_notification",
  label: "Post team alert",
  description:
    "Create an admin-team notification (visible in the bell menu) to flag something important, e.g. 'Maintenance scheduled for pool tomorrow 9–11 AM'. Args: title, message.",
  destructive: false,
  requiredArgs: ["title", "message"],
  summarize: (a) => `Post team alert: "${a.title}"`,
  validate: (a) => {
    if (!a.title?.trim()) return "Missing title.";
    if (!a.message?.trim()) return "Missing message.";
    return null;
  },
  run: async (a, user) => {
    const n = await db.notification.create({
      data: { title: a.title, message: a.message, type: "ALERT", userId: user.id },
    });
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "NOTIFICATION_CREATED",
        entity: "Notification",
        entityId: n.id,
        details: `"${a.title}" — ${a.message} (via Aria copilot)`,
      },
    });
    return {
      success: true,
      message: `Team alert "${a.title}" posted to the notifications bell.`,
      data: { notificationId: n.id },
    };
  },
};

// ============================================================
// Registry
// ============================================================

export const ADMIN_TOOLS: AdminTool[] = [
  confirmBooking,
  rejectBooking,
  checkInGuest,
  checkOutGuest,
  cancelBooking,
  markNoShow,
  setRoomStatus,
  addGuestNote,
  createNotification,
];

const TOOL_MAP: Record<string, AdminTool> = Object.fromEntries(
  ADMIN_TOOLS.map((t) => [t.name, t])
);

export function getTool(name: string): AdminTool | null {
  return TOOL_MAP[name] ?? null;
}

/** Human-readable catalog block injected into the AI system prompt. */
export function toolCatalogForPrompt(): string {
  return ADMIN_TOOLS.map((t) => {
    const argList = t.requiredArgs
      .map((r) => {
        if (r === "referenceNo") return `referenceNo (string — booking reference)`;
        if (r === "reason") return `reason (string — required explanation)`;
        if (r === "roomNumber") return `roomNumber (string — e.g. "V-01")`;
        if (r === "status")
          return `status (string — one of ${ROOM_STATUSES.join(" | ")})`;
        if (r === "guestEmail") return `guestEmail (string)`;
        if (r === "note") return `note (string)`;
        if (r === "title") return `title (string)`;
        if (r === "message") return `message (string)`;
        return `${r} (string)`;
      })
      .join(", ");
    return `### ${t.name}${t.destructive ? " [DESTRUCTIVE]" : ""}\n${t.description}\nArgs: ${argList}`;
  }).join("\n\n");
}

export { fmtDate };
