"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Info,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { BookingStatusBadge } from "./StatusBadges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { apiFetch } from "@/lib/api-client";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateShort,
} from "@/lib/utils";
import { BOOKING_STATUS_CONFIG, CALENDAR_STATUS_COLORS } from "@/lib/constants";
import type { CalendarCell, Reservation } from "@/types";

interface CalendarResponse {
  days: { date: string; day: number; weekday: string; isToday: boolean }[];
  calendar: {
    room: {
      id: string;
      number: string;
      name: string;
      type: string;
      capacity: number;
    };
    cells: CalendarCell[];
  }[];
  startDate: string;
  endDate: string;
}

const LEGEND = [
  { status: "AVAILABLE", label: "Available" },
  { status: "RESERVED", label: "Reserved" },
  { status: "OCCUPIED", label: "Occupied" },
  { status: "CLEANING", label: "Cleaning" },
  { status: "MAINTENANCE", label: "Maintenance" },
  { status: "BLOCKED", label: "Blocked" },
];

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function CalendarAdmin() {
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [rangeDays, setRangeDays] = useState(14);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);

  const end = useMemo(() => {
    const e = new Date(start);
    e.setDate(e.getDate() + rangeDays - 1);
    return e;
  }, [start, rangeDays]);

  const startISO = toISODate(start);
  const endISO = toISODate(end);

  const { data, isLoading } = useQuery({
    queryKey: ["calendar", startISO, endISO],
    queryFn: () =>
      apiFetch<CalendarResponse>(
        `/api/calendar?start=${startISO}&end=${endISO}`
      ),
  });

  function shift(days: number) {
    const d = new Date(start);
    d.setDate(d.getDate() + days);
    setStart(d);
  }

  function goToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setStart(d);
  }

  const rangeLabel = `${formatDateShort(start)} → ${formatDateShort(end)}`;

  // Group rooms by type for visual grouping
  const grouped = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, CalendarResponse["calendar"]>();
    for (const row of data.calendar) {
      const type = row.room.type || "Room";
      if (!map.has(type)) map.set(type, []);
      map.get(type)!.push(row);
    }
    return Array.from(map.entries());
  }, [data]);

  return (
    <AdminLayout
      title="Reservation Calendar"
      subtitle="Visualize room availability across dates"
      actions={
        <div className="hidden items-center gap-1 rounded-lg border bg-card p-0.5 md:flex">
          {[7, 14, 30].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={rangeDays === d ? "default" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setRangeDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      }
    >
      {/* Toolbar */}
      <Card className="rounded-2xl border-border/70 shadow-luxury">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
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
            <Button variant="outline" size="sm" className="h-9" onClick={goToday}>
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
            <div className="ml-2 flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {rangeLabel}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGEND.map((l) => (
              <div key={l.status} className="flex items-center gap-1.5">
                <span
                  className="size-3 rounded"
                  style={{ backgroundColor: CALENDAR_STATUS_COLORS[l.status] }}
                />
                <span className="text-xs text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar grid */}
      <Card className="mt-4 overflow-hidden rounded-2xl border-border/70 shadow-luxury">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header row */}
            <div className="sticky top-0 z-20 flex border-b bg-card">
              <div className="sticky left-0 z-30 w-52 shrink-0 border-r bg-card px-4 py-3">
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Room
                </div>
              </div>
              <div className="flex">
                {isLoading
                  ? Array.from({ length: rangeDays }).map((_, i) => (
                      <div
                        key={i}
                        className="flex w-20 shrink-0 flex-col items-center justify-center border-l py-3"
                      >
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="mt-1 h-4 w-6" />
                      </div>
                    ))
                  : data?.days.map((day) => (
                      <div
                        key={day.date}
                        className={cn(
                          "flex w-20 shrink-0 flex-col items-center justify-center border-l py-3",
                          day.isToday && "bg-emerald-50"
                        )}
                      >
                        <div
                          className={cn(
                            "text-[10px] font-medium uppercase tracking-wide",
                            day.isToday ? "text-emerald-700" : "text-muted-foreground"
                          )}
                        >
                          {day.weekday}
                        </div>
                        <div
                          className={cn(
                            "font-display text-sm font-semibold",
                            day.isToday
                              ? "flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white"
                              : "text-foreground"
                          )}
                        >
                          {day.day}
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            {/* Body */}
            <div>
              {isLoading ? (
                <div className="divide-y">
                  {Array.from({ length: 8 }).map((_, ri) => (
                    <div key={ri} className="flex">
                      <div className="sticky left-0 z-10 w-52 shrink-0 border-r bg-card px-4 py-3">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="mt-1 h-3 w-24" />
                      </div>
                      <div className="flex">
                        {Array.from({ length: rangeDays }).map((_, ci) => (
                          <Skeleton key={ci} className="m-1 h-14 w-[72px] rounded-md" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : grouped.length === 0 ? (
                <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No rooms to display
                </div>
              ) : (
                grouped.map(([type, rows]) => (
                  <div key={type}>
                    {/* Group header */}
                    <div className="sticky top-[57px] z-10 flex items-center gap-2 border-b border-t bg-muted/60 px-4 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {type}
                      </span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        {rows.length}
                      </Badge>
                    </div>
                    {rows.map((row, ri) => (
                      <motion.div
                        key={row.room.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: Math.min(ri * 0.012, 0.2) }}
                        className="flex border-b last:border-0 hover:bg-muted/20"
                      >
                        <div className="sticky left-0 z-10 w-52 shrink-0 border-r bg-card px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-md bg-emerald-50 text-xs font-semibold text-emerald-700">
                              {row.room.number}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-foreground">
                                {row.room.name}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <UsersIcon className="size-2.5" />
                                {row.room.capacity} guests
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex">
                          {row.cells.map((cell) => (
                            <CalendarCellView
                              key={cell.date}
                              cell={cell}
                              onClick={() => {
                                if (cell.reservationId) {
                                  setSelectedReservationId(cell.reservationId);
                                }
                              }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Hint */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="size-3.5" />
        Click any reserved or occupied cell to view reservation details. Use 7d / 14d / 30d to change the time window.
      </div>

      {/* Details dialog */}
      <CalendarReservationDialog
        id={selectedReservationId}
        onClose={() => setSelectedReservationId(null)}
      />
    </AdminLayout>
  );
}

function CalendarCellView({
  cell,
  onClick,
}: {
  cell: CalendarCell;
  onClick: () => void;
}) {
  const color = CALENDAR_STATUS_COLORS[cell.status] ?? CALENDAR_STATUS_COLORS.AVAILABLE;
  const isToday = (() => {
    const today = new Date();
    const d = new Date(cell.date);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  })();

  const hasReservation = ["RESERVED", "OCCUPIED"].includes(cell.status);

  const bgStyle: React.CSSProperties =
    cell.status === "AVAILABLE"
      ? { backgroundColor: "transparent" }
      : hasReservation
      ? { backgroundColor: color }
      : { backgroundColor: color + "33" }; // 20% opacity for cleaning/maintenance/blocked

  const textColor = hasReservation ? "#FFFFFF" : color;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={!hasReservation}
            className={cn(
              "m-1 h-14 w-[72px] shrink-0 rounded-md border px-2 py-1.5 text-left transition-all",
              isToday && "ring-1 ring-emerald-400 ring-offset-0",
              hasReservation
                ? "cursor-pointer hover:z-10 hover:scale-[1.03] hover:shadow-md"
                : "cursor-default",
              cell.status === "AVAILABLE" && "border-dashed border-border/70 bg-muted/30 hover:bg-muted/50"
            )}
            style={bgStyle}
          >
            {hasReservation ? (
              <div className="flex h-full flex-col justify-center">
                <div
                  className="truncate text-[10px] font-semibold leading-tight"
                  style={{ color: textColor }}
                >
                  {cell.guestName}
                </div>
                <div
                  className="truncate text-[9px] font-mono opacity-90"
                  style={{ color: textColor }}
                >
                  {cell.referenceNo}
                </div>
              </div>
            ) : cell.status !== "AVAILABLE" ? (
              <div className="flex h-full items-center justify-center">
                <span
                  className="text-[9px] font-medium uppercase tracking-wide"
                  style={{ color: textColor }}
                >
                  {cell.status.toLowerCase()}
                </span>
              </div>
            ) : null}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[220px] border-border bg-popover text-popover-foreground shadow-md"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-semibold">{cell.status}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {cell.roomName} · #{cell.roomNumber}
            </div>
            <div className="text-xs text-muted-foreground">{cell.date}</div>
            {cell.guestName && (
              <div className="border-t border-border pt-1 text-xs">
                <span className="font-medium">{cell.guestName}</span>
                <br />
                <span className="font-mono text-muted-foreground">
                  {cell.referenceNo}
                </span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CalendarReservationDialog({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["reservation", id],
    queryFn: () =>
      id
        ? apiFetch<{ reservation: Reservation }>(`/api/reservations/${id}`)
        : Promise.reject(new Error("no id")),
    enabled: !!id,
  });

  const r = data?.reservation;

  // Pre-warm / invalidate dashboard when modal closes
  function handleClose(open: boolean) {
    if (!open) {
      qc.invalidateQueries({ queryKey: ["calendar"] });
      onClose();
    }
  }

  return (
    <Dialog open={!!id} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="border-b p-6">
          <DialogTitle className="text-base">
            {r ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-emerald-700">
                  {r.referenceNo}
                </span>
                <BookingStatusBadge status={r.status} />
              </div>
            ) : (
              "Reservation details"
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Calendar reservation preview
          </DialogDescription>
        </DialogHeader>
        {isLoading || !r ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
                {r.guest
                  ? `${r.guest.firstName[0] ?? ""}${r.guest.lastName[0] ?? ""}`.toUpperCase()
                  : "G"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {r.guest?.firstName} {r.guest?.lastName}
                </div>
                <div className="text-xs text-muted-foreground">{r.guest?.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoBlock label="Check-in" value={formatDate(r.checkIn)} />
              <InfoBlock label="Check-out" value={formatDate(r.checkOut)} />
              <InfoBlock
                label="Nights"
                value={`${r.nights} ${r.nights === 1 ? "night" : "nights"}`}
              />
              <InfoBlock
                label="Guests"
                value={`${r.adults} adults · ${r.children} children`}
              />
            </div>

            <div>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Room
              </div>
              {r.rooms?.map((rr) => (
                <div
                  key={rr.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {rr.room?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      #{rr.room?.number} · {rr.room?.type?.name ?? "Room"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground">
                      {formatCurrency(rr.subtotal)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(rr.pricePerNight)}/night
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
              <span className="text-sm font-medium text-emerald-900">Total</span>
              <span className="font-display text-lg font-semibold text-emerald-900">
                {formatCurrency(r.totalAmount)}
              </span>
            </div>

            {r.specialRequests && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Special requests
                </div>
                <p className="mt-1 text-sm text-foreground">{r.specialRequests}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="size-3.5" />
              Source: {r.source} · Created {formatDateShort(r.createdAt)}
            </div>

            <div className="text-xs text-muted-foreground">
              Status:{" "}
              <span className="font-medium text-foreground">
                {BOOKING_STATUS_CONFIG[r.status]?.label ?? r.status}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export default CalendarAdmin;
