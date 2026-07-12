import { db } from "@/lib/db";
import { RESORT_INFO } from "@/lib/constants";
import { toolCatalogForPrompt, fmtDate } from "./admin-copilot-tools";

// ============================================================
// Admin Copilot ("Aria") — Knowledge Base
//
// Builds the system prompt for Aria, the resort's operations
// copilot. Aria answers questions about live data AND can propose
// automation actions — but every write action is emitted as a
// fenced JSON block that the admin must explicitly approve in the
// UI before it executes.
//
// Live context (counts, today's arrivals/departures, pending
// reservations, room status breakdown) is fetched fresh on every
// request so Aria's answers are always current.
// ============================================================

interface LiveContext {
  pendingCount: number;
  confirmedCount: number;
  checkedInCount: number;
  arrivalsToday: number;
  departuresToday: number;
  occupancyRate: number;
  availableRooms: number;
  occupiedRooms: number;
  totalRooms: number;
  revenueToday: number;
  pendingList: { referenceNo: string; guestName: string; checkIn: string; nights: number; total: number; status: string }[];
  arrivalsList: { referenceNo: string; guestName: string; roomNames: string }[];
  departuresList: { referenceNo: string; guestName: string; roomNames: string }[];
  roomStatusBreakdown: { status: string; count: number }[];
}

async function fetchLiveContext(): Promise<LiveContext> {
  const today = new Date();
  const todayStr = new Date(today.toDateString());
  const tomorrow = new Date(todayStr);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    pending,
    confirmed,
    checkedIn,
    arrivals,
    departures,
    totalRooms,
    availableRooms,
    occupiedRooms,
    revenueAgg,
    roomStatuses,
  ] = await Promise.all([
    db.reservation.findMany({
      where: { status: "PENDING" },
      include: { guest: true, rooms: { include: { room: true } } },
      orderBy: { createdAt: "asc" },
      take: 12,
    }),
    db.reservation.count({ where: { status: "CONFIRMED" } }),
    db.reservation.count({ where: { status: "CHECKED_IN" } }),
    db.reservation.findMany({
      where: { status: { in: ["CONFIRMED", "CHECKED_IN"] }, checkIn: { gte: todayStr, lt: tomorrow } },
      include: { guest: true, rooms: { include: { room: true } } },
      orderBy: { checkIn: "asc" },
    }),
    db.reservation.findMany({
      where: { status: { in: ["CHECKED_IN", "COMPLETED"] }, checkOut: { gte: todayStr, lt: tomorrow } },
      include: { guest: true, rooms: { include: { room: true } } },
      orderBy: { checkOut: "asc" },
    }),
    db.room.count({ where: { isActive: true } }),
    db.room.count({ where: { isActive: true, status: "AVAILABLE" } }),
    db.room.count({ where: { isActive: true, status: "OCCUPIED" } }),
    db.reservation.aggregate({
      where: { status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED"] }, confirmedAt: { gte: todayStr, lt: tomorrow } },
      _sum: { totalAmount: true },
    }),
    db.room.groupBy({ by: ["status"], where: { isActive: true }, _count: true }),
  ]);

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return {
    pendingCount: pending.length,
    confirmedCount: confirmed,
    checkedInCount: checkedIn,
    arrivalsToday: arrivals.length,
    departuresToday: departures.length,
    occupancyRate,
    availableRooms,
    occupiedRooms,
    totalRooms,
    revenueToday: revenueAgg._sum.totalAmount ?? 0,
    pendingList: pending.map((r) => ({
      referenceNo: r.referenceNo,
      guestName: `${r.guest.firstName} ${r.guest.lastName}`,
      checkIn: fmtDate(r.checkIn),
      nights: r.nights,
      total: r.totalAmount,
      status: r.status,
    })),
    arrivalsList: arrivals.map((r) => ({
      referenceNo: r.referenceNo,
      guestName: `${r.guest.firstName} ${r.guest.lastName}`,
      roomNames: r.rooms.map((rr) => rr.room.name).join(", ") || "—",
    })),
    departuresList: departures.map((r) => ({
      referenceNo: r.referenceNo,
      guestName: `${r.guest.firstName} ${r.guest.lastName}`,
      roomNames: r.rooms.map((rr) => rr.room.name).join(", ") || "—",
    })),
    roomStatusBreakdown: roomStatuses.map((s) => ({ status: s.status, count: s._count })),
  };
}

function formatContextBlock(ctx: LiveContext): string {
  const pendingLines = ctx.pendingList.length
    ? ctx.pendingList
        .map(
          (p) =>
            `- ${p.referenceNo} · ${p.guestName} · check-in ${p.checkIn} · ${p.nights} night(s) · ₱${Math.round(p.total).toLocaleString()} · ${p.status}`
        )
        .join("\n")
    : "(none)";

  const arrivalLines = ctx.arrivalsList.length
    ? ctx.arrivalsList.map((a) => `- ${a.referenceNo} · ${a.guestName} · ${a.roomNames}`).join("\n")
    : "(none)";

  const departureLines = ctx.departuresList.length
    ? ctx.departuresList.map((d) => `- ${d.referenceNo} · ${d.guestName} · ${d.roomNames}`).join("\n")
    : "(none)";

  const roomLines = ctx.roomStatusBreakdown.length
    ? ctx.roomStatusBreakdown.map((r) => `- ${r.status}: ${r.count}`).join("\n")
    : "(no data)";

  return `## Live operations snapshot (as of ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })})
- Pending reservations: ${ctx.pendingCount}
- Confirmed (upcoming): ${ctx.confirmedCount}
- Currently checked-in: ${ctx.checkedInCount}
- Arrivals today: ${ctx.arrivalsToday}
- Departures today: ${ctx.departuresToday}
- Occupancy: ${ctx.occupancyRate}% (${ctx.occupiedRooms}/${ctx.totalRooms} rooms occupied, ${ctx.availableRooms} available)
- Revenue confirmed today: ₱${Math.round(ctx.revenueToday).toLocaleString()}

### Pending reservations awaiting action
${pendingLines}

### Today's arrivals
${arrivalLines}

### Today's departures
${departureLines}

### Room status breakdown
${roomLines}`;
}

export async function buildAdminCopilotSystemPrompt(): Promise<string> {
  let ctx: LiveContext;
  try {
    ctx = await fetchLiveContext();
  } catch (e) {
    console.error("[admin-copilot] failed to load live context:", (e as Error)?.message);
    ctx = {
      pendingCount: 0, confirmedCount: 0, checkedInCount: 0, arrivalsToday: 0, departuresToday: 0,
      occupancyRate: 0, availableRooms: 0, occupiedRooms: 0, totalRooms: 0, revenueToday: 0,
      pendingList: [], arrivalsList: [], departuresList: [], roomStatusBreakdown: [],
    };
  }

  return `You are **Aria**, the operations copilot for **${RESORT_INFO.name}**, an exclusive private beachfront villa in ${RESORT_INFO.addressShort}, Philippines. You assist the resort's admin and staff team directly inside the management dashboard.

# Your persona
- Sharp, efficient, and operational — like a capable operations manager who keeps the front desk running smoothly.
- You speak to the admin, not to guests. Your tone is professional, concise, and action-oriented.
- Most replies should be 1–4 sentences. Use tight bullet lists when listing bookings, rooms, or steps. Never write essays.
- You are decisive: when you see something that needs doing, propose the action.

# What you CAN do
- Answer questions about live operations: today's arrivals/departures, pending bookings, occupancy, room statuses, revenue, recent activity. Use ONLY the live snapshot below — never fabricate numbers or reference numbers.
- Propose automation actions the admin can approve with one click (see the action format below). This is your superpower — when a task is clear, propose the exact action instead of just describing it.
- Summarize and explain the state of the resort.

# What you CANNOT do
- You cannot execute anything yourself. Every write action you propose is shown to the admin as a confirmation card; nothing happens until they click "Approve".
- Never invent a reference number, guest name, room number, or price. If you don't have it in the live snapshot, say so and tell the admin how to find it (e.g. "open Bookings").
- Never propose more than ONE action per message. Pick the single most relevant one.
- Do not propose actions for reservations or rooms not listed in the live snapshot unless the admin gave you the exact reference/room number in their message.

# Proposing an action — CRITICAL
When the admin asks you to DO something (confirm, reject, check in, check out, cancel, mark no-show, set room status, add a note, or post an alert), you MUST propose it as an action. Do NOT just say "I'll do that" — always emit the action block so the admin can approve it with one click.

Format: end your reply with a fenced code block tagged \`aria-action\` containing a single JSON object:

\`\`\`aria-action
{"tool": "<tool_name>", "args": {"<arg>": "<value>", ...}, "why": "<one short sentence explaining why>"}
\`\`\`

Hard rules:
- The \`tool\` MUST be one of the tools in the catalog below. Never invent a tool name.
- Include ALL required args for that tool, with exact values.
- Use the EXACT reference numbers / room numbers from the live snapshot or from what the admin told you. Never make one up.
- Add a short \`why\` field (one sentence) explaining the intent.
- The action block goes at the very END of your message, after a 1–2 sentence explanation.
- Propose only ONE action per message.
- If you cannot propose an action (e.g. the reference number is missing or ambiguous), ask the admin to clarify — do NOT emit a block with guessed values.

Example — admin says "post an alert that the pool is closed today":
Pool maintenance noted — I'll post a team alert so it shows in everyone's notifications bell.

\`\`\`aria-action
{"tool": "create_notification", "args": {"title": "Pool closed today", "message": "The pool is closed today for maintenance."}, "why": "Inform the team of the temporary pool closure."}
\`\`\`

Example — admin says "confirm booking TTF-2026-123456":
Got it — confirming that reservation will lock in the guest's dates and mark the rooms as RESERVED.

\`\`\`aria-action
{"tool": "confirm_booking", "args": {"referenceNo": "TTF-2026-123456"}, "why": "Lock in the guest's dates."}
\`\`\`

For read-only questions (e.g. "how many arrivals today?", "what's our occupancy?"), just answer directly — do NOT propose an action. Only propose an action when the admin is asking you to perform a write operation.

# Available tools
${toolCatalogForPrompt()}

# ${formatContextBlock(ctx)}

# Response style rules
- Keep replies short and scannable.
- When quoting a booking, always show the reference number and guest name.
- When you propose an action, briefly state what will happen in plain words, then emit the action block.
- For destructive actions (cancel, reject, no-show — marked [DESTRUCTIVE]), explicitly note that it's destructive and requires a reason.
- Do not use markdown headings (#). You may use **bold**, bullet lists, and line breaks.
- If the admin's request is ambiguous (e.g. "confirm the booking" with no reference), ask them to specify which one — don't guess.`;
}
