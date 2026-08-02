"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Ban,
} from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { BlockDatesDialog } from "./BlockDatesDialog";
import { BookingStatusBadge } from "./StatusBadges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { apiFetch } from "@/lib/api-client";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateShort,
  getInitials,
} from "@/lib/utils";
import { CALENDAR_STATUS_COLORS } from "@/lib/constants";
import type { Reservation, Room } from "@/types";

type CellStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "OCCUPIED"
  | "CLEANING"
  | "MAINTENANCE"
  | "BLOCKED";

interface CalendarRow {
  room: {
    id: string;
    number: string;
    name: string;
    type: string;
    capacity: number;
  };
  cells: Array<{
    roomId: string;
    roomNumber: string;
    roomName: string;
    date: string;
    status: CellStatus;
    reservationId?: string;
    referenceNo?: string;
    guestName?: string;
  }>;
}

interface CalendarResponse {
  days: Array<{
    date: string;
    day: number;
    weekday: string;
    isToday: boolean;
  }>;
  calendar: CalendarRow[];
  startDate: string;
  endDate: string;
}

// Blocked date range fetched from /api/calendar/block.
interface BlockedDateEntry {
  id: string;
  roomId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

const RANGE_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 14, label: "14d" },
  { value: 30, label: "30d" },
] as const;

const LEGEND: { status: CellStatus; label: string }[] = [
  { status: "AVAILABLE", label: "Open" },
  { status: "RESERVED", label: "Reserved" },
  { status: "OCCUPIED", label: "Occupied" },
  { status: "CLEANING", label: "Cleaning" },
  { status: "MAINTENANCE", label: "Maintenance" },
  { status: "BLOCKED", label: "Blocked" },
];

export function CalendarAdmin() {
  const [range, setRange] = useState<number>(14);
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);

  const { start, end } = useMemo(() => {
    const s = new Date(anchor);
    s.setHours(0, 0, 0, 0);
    const e = new Date(s);
    e.setDate(e.getDate() + range - 1);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }, [anchor, range]);

  const queryParams = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
  });

  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ["admin-calendar", start.toISOString(), end.toISOString()],
    queryFn: () => apiFetch<CalendarResponse>(`/api/calendar?${queryParams.toString()}`),
  });

  // Also fetch reservations to recompute cell statuses (fixes the "cleaning
  // shows across all days" bug from the API — the API uses room.status ===
  // "CLEANING" which persists beyond a single day).
  const { data: reservationsData } = useQuery({
    queryKey: ["admin-reservations", "calendar-all"],
    queryFn: () =>
      apiFetch<{ reservations: Reservation[] }>(
        "/api/reservations?limit=200"
      ),
  });

  // Also fetch rooms for current room-level status (MAINTENANCE/BLOCKED)
  const { data: roomsData } = useQuery({
    queryKey: ["admin-rooms", "calendar"],
    queryFn: () => apiFetch<{ rooms: Room[] }>("/api/rooms"),
  });

  // Fetch admin-blocked date ranges (Step 6: Block Dates feature).
  // These take precedence over reservations in the cell status — a
  // blocked day shows red and cannot be booked by public users.
  const { data: blocksData } = useQuery({
    queryKey: ["blocked-dates"],
    queryFn: () => apiFetch<{ blocks: BlockedDateEntry[] }>("/api/calendar/block"),
  });

  // Map roomId -> list of blocked date ranges for quick lookup.
  const blocksByRoom = useMemo(() => {
    const m = new Map<string, BlockedDateEntry[]>();
    for (const b of blocksData?.blocks ?? []) {
      const list = m.get(b.roomId) ?? [];
      list.push(b);
      m.set(b.roomId, list);
    }
    return m;
  }, [blocksData]);

  const roomStatusMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of roomsData?.rooms ?? []) {
      m.set(r.id, r.status as string);
    }
    return m;
  }, [roomsData]);

  const reservationsByRoom = useMemo(() => {
    const m = new Map<string, Reservation[]>();
    for (const r of reservationsData?.reservations ?? []) {
      for (const rr of r.rooms ?? []) {
        const list = m.get(rr.roomId) ?? [];
        list.push(r);
        m.set(rr.roomId, list);
      }
    }
    return m;
  }, [reservationsData]);

  // Recompute cell statuses with the proper per-day logic.
  const rows = useMemo(() => {
    if (!calendarData) return [];
    return calendarData.calendar.map((row) => {
      const roomRes = reservationsByRoom.get(row.room.id) ?? [];
      const roomStatus = roomStatusMap.get(row.room.id) ?? "AVAILABLE";
      const roomBlocks = blocksByRoom.get(row.room.id) ?? [];
      const newCells = row.cells.map((cell) => {
        const day = new Date(cell.date);
        day.setHours(0, 0, 0, 0);
        const computed = computeCellStatus(day, roomRes, roomStatus, roomBlocks);
        // Preserve original reservationId/ref/guestName from API cell when
        // the computed cell still has a reservation attached.
        const attachedRes = computed.reservation;
        return {
          ...cell,
          status: computed.status,
          reservationId: attachedRes?.id ?? cell.reservationId,
          referenceNo: attachedRes?.referenceNo ?? cell.referenceNo,
          guestName: attachedRes
            ? `${attachedRes.guest?.firstName ?? ""} ${attachedRes.guest?.lastName ?? ""}`.trim() ||
              cell.guestName
            : cell.guestName,
        };
      });
      return { ...row, cells: newCells };
    });
  }, [calendarData, reservationsByRoom, roomStatusMap, blocksByRoom]);

  const days = calendarData?.days ?? [];

  const selectedReservation = useMemo(() => {
    if (!selectedReservationId) return null;
    return (
      reservationsData?.reservations.find(
        (r) => r.id === selectedReservationId
      ) ?? null
    );
  }, [selectedReservationId, reservationsData]);

  function shift(days: number) {
    const next = new Date(anchor);
    next.setDate(next.getDate() + days);
    setAnchor(next);
  }

  const rangeLabel = `${formatDateShort(start)} – ${formatDateShort(end)}`;

  return (
    <AdminLayout
      title="Calendar"
      subtitle="See where every room is for every day"
    >
      {/* Controls */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => shift(-7)}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setAnchor(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => shift(7)}
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </Button>
          <span className="ml-2 hidden font-display text-base font-medium tracking-tight text-foreground sm:inline">
            {rangeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
          {RANGE_OPTIONS.map((opt) => {
            const active = range === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={cn(
                  "min-h-[32px] rounded-md px-3 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {/* Step 6: Block Dates — opens a dialog to mark a room unavailable
            for a date range (owner use, maintenance, holiday holds). */}
        {roomsData?.rooms && (
          <BlockDatesDialog rooms={roomsData.rooms}>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Ban className="size-4 text-red-600 dark:text-red-400" />
              Block Dates
            </Button>
          </BlockDatesDialog>
        )}
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        {LEGEND.map((l) => (
          <div key={l.status} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: CALENDAR_STATUS_COLORS[l.status] }}
            />
            <span className="text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <Card className="overflow-hidden rounded-lg border border-border shadow-card">
        {calendarLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[900px] border-separate border-spacing-0">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="sticky left-0 z-10 w-36 min-w-[9rem] border-b border-r border-border bg-card text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Room
                  </TableHead>
                  {days.map((d) => (
                    <TableHead
                      key={d.date}
                      className={cn(
                        "border-b border-border px-2 py-2 text-center text-xs",
                        d.isToday
                          ? "bg-coral/10 font-semibold text-coral"
                          : "font-medium text-muted-foreground"
                      )}
                    >
                      <div className="text-[10px] uppercase tracking-wide">
                        {d.weekday}
                      </div>
                      <div className="text-sm">{d.day}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.room.id} className="hover:bg-transparent">
                    <TableCell className="sticky left-0 z-10 w-36 min-w-[9rem] border-b border-r border-border bg-card px-3 py-2 align-top">
                      <div className="truncate text-sm font-medium text-foreground">
                        {row.room.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {row.room.type} · sleeps {row.room.capacity}
                      </div>
                    </TableCell>
                    {row.cells.map((cell) => (
                      <TableCell
                        key={cell.date}
                        className="border-b border-border p-0 align-top"
                      >
                        <CellContent
                          cell={cell}
                          onClick={() => {
                            if (cell.reservationId) {
                              setSelectedReservationId(cell.reservationId);
                            }
                          }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" />
        Click any booked cell to view the reservation details.
      </p>

      {/* Reservation details dialog */}
      {selectedReservation && (
        <ReservationDialog
          reservation={selectedReservation}
          open={!!selectedReservation}
          onClose={() => setSelectedReservationId(null)}
        />
      )}
    </AdminLayout>
  );
}

function CellContent({
  cell,
  onClick,
}: {
  cell: CalendarRow["cells"][number];
  onClick: () => void;
}) {
  const isAvailable = cell.status === "AVAILABLE";
  const color = CALENDAR_STATUS_COLORS[cell.status] ?? CALENDAR_STATUS_COLORS.AVAILABLE;
  const hasReservation = !!cell.reservationId;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isAvailable}
      aria-label={
        hasReservation
          ? `${cell.guestName ?? "Guest"} — ${cell.referenceNo ?? ""}`
          : cell.status === "BLOCKED"
            ? "Blocked"
            : cell.status === "MAINTENANCE"
              ? "Maintenance"
              : cell.status === "CLEANING"
                ? "Cleaning"
                : "Open"
      }
      className={cn(
        "flex min-h-[44px] w-full flex-col items-start gap-0.5 px-2 py-1.5 text-left text-[11px] leading-tight transition-opacity",
        isAvailable ? "cursor-default" : "hover:opacity-90"
      )}
      style={{
        backgroundColor: isAvailable
          ? "transparent"
          : `${color}22`,
        borderLeft: isAvailable
          ? "1px solid transparent"
          : `3px solid ${color}`,
      }}
    >
      {hasReservation && (
        <>
          <span
            className="line-clamp-1 w-full font-medium text-foreground"
            title={cell.guestName}
          >
            {cell.guestName}
          </span>
          <span className="line-clamp-1 w-full font-mono text-[10px] text-muted-foreground">
            {cell.referenceNo}
          </span>
        </>
      )}
      {isAvailable && (
        <span className="text-[10px] text-muted-foreground/40">Open</span>
      )}
    </button>
  );
}

function ReservationDialog({
  reservation,
  open,
  onClose,
}: {
  reservation: Reservation;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-border px-4 py-5 sm:px-6">
          <DialogTitle className="font-display text-xl font-medium tracking-tight">
            Reservation
          </DialogTitle>
          <DialogDescription className="break-all">
            Reference{" "}
            <span className="font-mono text-foreground">
              {reservation.referenceNo}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[85vh] overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mb-4 flex items-center gap-2">
            <BookingStatusBadge status={reservation.status} friendly />
          </div>

          <div className="mb-4 flex items-center gap-3">
            <Avatar className="size-10 shrink-0 border border-border">
              <AvatarFallback className="bg-sand text-xs font-semibold text-primary">
                {reservation.guest
                  ? getInitials(
                      `${reservation.guest.firstName} ${reservation.guest.lastName}`
                    )
                  : "??"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">
                {reservation.guest?.firstName} {reservation.guest?.lastName}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {reservation.guest?.email} · {reservation.guest?.phone}
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Check in</dt>
            <dd className="break-words text-right text-foreground">
              {formatDate(reservation.checkIn)}
            </dd>
            <dt className="text-muted-foreground">Check out</dt>
            <dd className="break-words text-right text-foreground">
              {formatDate(reservation.checkOut)}
            </dd>
            <dt className="text-muted-foreground">Nights</dt>
            <dd className="text-right text-foreground">
              {reservation.nights}
            </dd>
            <dt className="text-muted-foreground">Room</dt>
            <dd className="break-words text-right text-foreground">
              {reservation.rooms?.[0]?.room?.name ?? "—"}
            </dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="text-right font-medium text-foreground">
              {formatCurrency(reservation.totalAmount)}
            </dd>
          </dl>
        </div>

        <DialogFooter className="border-t border-border px-4 py-4 sm:px-6">
          <Button variant="outline" className="ml-auto" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Cell status computation — fixes the "cleaning across all
// days" bug from the API. The API marks CLEANING based on
// room.status which persists; we instead show CLEANING only
// on the checkout day of a just-departed reservation.
//
// Step 6: Also checks admin-blocked date ranges. A blocked day
// shows BLOCKED (red) and takes precedence over reservations —
// the admin explicitly marked it unavailable.
// ============================================================
function computeCellStatus(
  day: Date,
  roomReservations: Reservation[],
  roomStatus: string,
  roomBlocks: BlockedDateEntry[] = []
): { status: CellStatus; reservation?: Reservation } {
  // 1. Room-level maintenance/blocked takes precedence
  if (roomStatus === "MAINTENANCE") return { status: "MAINTENANCE" };
  if (roomStatus === "BLOCKED") return { status: "BLOCKED" };

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  // 2. Check admin date-range blocks — [startDate, endDate) semantics.
  // A block covers the night of startDate up to (but not including) endDate.
  for (const b of roomBlocks) {
    const bs = new Date(b.startDate);
    bs.setHours(0, 0, 0, 0);
    const be = new Date(b.endDate);
    be.setHours(0, 0, 0, 0);
    if (dayStart >= bs && dayStart < be) {
      return { status: "BLOCKED" };
    }
  }

  for (const r of roomReservations) {
    if (["CANCELLED", "REJECTED"].includes(r.status)) continue;
    const ci = new Date(r.checkIn);
    ci.setHours(0, 0, 0, 0);
    const co = new Date(r.checkOut);
    co.setHours(0, 0, 0, 0);

    const isCheckoutDay = co.getTime() === dayStart.getTime();
    const coversDay =
      ci.getTime() <= dayStart.getTime() && dayStart.getTime() < co.getTime();

    if (coversDay) {
      // Stay covers this night
      if (r.status === "PENDING") {
        return { status: "RESERVED", reservation: r };
      }
      // CHECKED_IN, CONFIRMED, COMPLETED (still in the stay window)
      return { status: "OCCUPIED", reservation: r };
    }

    if (isCheckoutDay) {
      // Checkout day — guest leaves in the morning
      if (r.status === "COMPLETED") {
        // Already checked out → room needs cleaning (single day only)
        return { status: "CLEANING", reservation: r };
      }
      if (r.status === "CHECKED_IN") {
        // Still physically there in the morning
        return { status: "OCCUPIED", reservation: r };
      }
      if (r.status === "CONFIRMED") {
        // Confirmed but not yet checked in on the checkout day
        // (unusual but possible if check-in didn't happen)
        return { status: "RESERVED", reservation: r };
      }
    }
  }

  return { status: "AVAILABLE" };
}

export default CalendarAdmin;
