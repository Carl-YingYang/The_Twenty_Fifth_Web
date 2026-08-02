"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  Check,
  Clock,
  DoorOpen,
  LogIn,
  LogOut,
  Plus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";

import { AdminLayout } from "./AdminLayout";
import { ConfirmDialog } from "./ConfirmDialog";
import { StatCard, EmptyState } from "./StatCard";
import { BookingStatusBadge } from "./StatusBadges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn, formatCurrency, formatDateShort, formatClockTime } from "@/lib/utils";
import { RESORT_INFO } from "@/lib/constants";
import { useViewStore } from "@/store/useViewStore";
import type { DashboardStats, Reservation } from "@/types";

export function DashboardAdmin() {
  const { navigate } = useViewStore();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiFetch<DashboardStats>("/api/dashboard"),
    refetchInterval: 60 * 1000,
  });

  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <AdminLayout title="Today" subtitle={today}>
      {/* Greeting */}
      <div className="mb-6">
        <div className="eyebrow">{today}</div>
        <h2 className="mt-1 font-display text-3xl font-medium tracking-tight text-foreground">
          {greeting}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what needs your attention at the villa today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={LogIn}
          label="Today's arrivals"
          value={data?.arrivalsToday ?? 0}
          loading={isLoading}
          hint="Guests checking in"
        />
        <StatCard
          icon={LogOut}
          label="Today's departures"
          value={data?.departuresToday ?? 0}
          loading={isLoading}
          hint="Guests checking out"
        />
        <StatCard
          icon={Users}
          label="In-house guests"
          value={data?.occupiedRooms ?? 0}
          loading={isLoading}
          hint={`${data?.availableRooms ?? 0} rooms open`}
        />
        <StatCard
          icon={Clock}
          label="Pending requests"
          value={data?.pendingReservations ?? 0}
          loading={isLoading}
          hint="Awaiting your review"
          deltaTone={data && data.pendingReservations > 0 ? "down" : "neutral"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Needs your attention */}
        <NeedsAttention />

        {/* Occupancy donut */}
        <Card className="rounded-lg border border-border p-5 shadow-card lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="eyebrow">Right now</div>
              <h3 className="mt-1 font-display text-lg font-medium tracking-tight">
                Occupancy
              </h3>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <OccupancyDonut
              occupied={data?.occupiedRooms ?? 0}
              available={data?.availableRooms ?? 0}
              rate={data?.occupancyRate ?? 0}
            />
          )}
        </Card>
      </div>

      {/* Today's timeline */}
      <div className="mt-6">
        <TodayTimeline
          arrivals={data?.todayTimeline?.arrivals ?? []}
          departures={data?.todayTimeline?.departures ?? []}
          loading={isLoading}
        />
      </div>

      {/* Quick actions */}
      <div className="mt-6 pb-6">
        <div className="eyebrow mb-3">Quick actions</div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => navigate("admin-bookings")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            New reservation
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("admin-calendar")}
          >
            <CalendarDays className="size-4" />
            View calendar
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("admin-reports")}
          >
            <BarChart3 className="size-4" />
            View reports
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

function NeedsAttention() {
  const qc = useQueryClient();
  const navigate = useViewStore((s) => s.navigate);
  const [pendingAction, setPendingAction] = useState<{
    reservation: Reservation;
    status: "CONFIRMED" | "REJECTED";
  } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reservations", "PENDING"],
    queryFn: () =>
      apiFetch<{ reservations: Reservation[] }>(
        "/api/reservations?status=PENDING&limit=10"
      ),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      rejectedReason,
    }: {
      id: string;
      status: string;
      rejectedReason?: string;
    }) =>
      apiFetch<{ reservation: Reservation }>(
        `/api/reservations/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, rejectedReason }),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong.";
      toast.error(message);
    },
  });

  const confirmMeta = (() => {
    if (!pendingAction) return null;
    const r = pendingAction.reservation;
    const guest =
      `${r.guest?.firstName ?? ""} ${r.guest?.lastName ?? ""}`.trim() ||
      "this guest";
    const ref = r.referenceNo;
    if (pendingAction.status === "CONFIRMED") {
      return {
        tone: "success" as const,
        title: "Approve this reservation?",
        description: `You're about to confirm ${ref} for ${guest}. The guest will receive a confirmation email and the room will be held for their dates.`,
        confirmLabel: "Approve reservation",
        hint: "The guest will be notified by email.",
        successToast: "Reservation approved.",
        emailKey: "Confirmation email sent to",
      };
    }
    return {
      tone: "destructive" as const,
      title: "Decline this reservation?",
      description: `Declining ${ref} (${guest}) releases the held dates back to availability. The guest will be notified that their booking could not be accommodated.`,
      confirmLabel: "Decline reservation",
      hint: "This cannot be undone.",
      successToast: "Reservation declined.",
      emailKey: "Cancellation notice sent to",
    };
  })();

  const confirmStatus = async () => {
    if (!pendingAction || !confirmMeta) return;
    try {
      await statusMutation.mutateAsync({
        id: pendingAction.reservation.id,
        status: pendingAction.status,
      });
      toast.success(confirmMeta.successToast);
      const email = pendingAction.reservation.guest?.email;
      if (email)
        setTimeout(
          () => toast.info(`✉️ ${confirmMeta.emailKey} ${email}`),
          800
        );
      setPendingAction(null);
    } catch {
      // error toast already shown by mutation onError
    }
  };

  const pending = data?.reservations ?? [];

  return (
    <Card className="rounded-lg border border-border p-5 shadow-card lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="eyebrow">Needs your attention</div>
          <h3 className="mt-1 font-display text-lg font-medium tracking-tight">
            Pending reservations
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-primary"
          onClick={() => navigate("admin-bookings")}
        >
          View all
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <EmptyState
          icon={Check}
          title="You're all caught up"
          description="No pending reservations need your review."
        />
      ) : (
        <ul className="divide-y divide-border">
          {pending.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">
                    {r.guest?.firstName} {r.guest?.lastName}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {r.referenceNo}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatDateShort(r.checkIn)} → {formatDateShort(r.checkOut)} ·{" "}
                  {r.nights} {r.nights === 1 ? "night" : "nights"} ·{" "}
                  {formatCurrency(r.totalAmount)}
                </div>
              </div>
              <div className="flex shrink-0 gap-2 sm:w-auto">
                <Button
                  size="sm"
                  className="flex-1 h-9 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none"
                  disabled={statusMutation.isPending}
                  onClick={() =>
                    setPendingAction({ reservation: r, status: "CONFIRMED" })
                  }
                >
                  <Check className="size-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 border-red-300 text-red-700 hover:bg-red-50 sm:flex-none"
                  disabled={statusMutation.isPending}
                  onClick={() =>
                    setPendingAction({ reservation: r, status: "REJECTED" })
                  }
                >
                  <X className="size-4" />
                  Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(o) => !o && setPendingAction(null)}
        tone={confirmMeta?.tone ?? "default"}
        title={confirmMeta?.title ?? ""}
        description={confirmMeta?.description ?? ""}
        confirmLabel={confirmMeta?.confirmLabel ?? "Confirm"}
        hint={confirmMeta?.hint}
        loading={statusMutation.isPending}
        onConfirm={confirmStatus}
      />
    </Card>
  );
}

function TodayTimeline({
  arrivals,
  departures,
  loading,
}: {
  arrivals: Reservation[];
  departures: Reservation[];
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="rounded-lg border border-border p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <LogIn className="size-4 text-primary" />
          <h3 className="font-display text-lg font-medium tracking-tight">
            Arrivals today
          </h3>
          <span className="ml-auto text-xs font-medium text-muted-foreground">
            {arrivals.length}
          </span>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : arrivals.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No arrivals today"
            description="Guests checking in will appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {arrivals.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary leading-tight">
                  {formatClockTime(RESORT_INFO.checkInTime).replace(" ", "")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {r.guest?.firstName} {r.guest?.lastName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {r.rooms?.[0]?.room?.name ?? "Room"} ·{" "}
                    {r.referenceNo}
                  </div>
                </div>
                <BookingStatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="rounded-lg border border-border p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <LogOut className="size-4 text-coral" />
          <h3 className="font-display text-lg font-medium tracking-tight">
            Departures today
          </h3>
          <span className="ml-auto text-xs font-medium text-muted-foreground">
            {departures.length}
          </span>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : departures.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No departures today"
            description="Guests checking out will appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {departures.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-md bg-coral/10 text-xs font-semibold text-coral leading-tight">
                  {formatClockTime(RESORT_INFO.checkOutTime).replace(" ", "")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {r.guest?.firstName} {r.guest?.lastName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {r.rooms?.[0]?.room?.name ?? "Room"} · {r.referenceNo}
                  </div>
                </div>
                <BookingStatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function OccupancyDonut({
  occupied,
  available,
  rate,
}: {
  occupied: number;
  available: number;
  rate: number;
}) {
  const data = [
    { name: "Occupied", value: occupied, color: "#2E8B57" },
    { name: "Available", value: available, color: "#D6DCD0" },
  ];
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={84}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-medium tracking-tight text-foreground">
            {rate}%
          </span>
          <span className="text-xs text-muted-foreground">occupied</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={cn("size-2.5 rounded-full")}
            style={{ backgroundColor: "#2E8B57" }}
          />
          <span className="text-muted-foreground">
            Occupied <span className="font-medium text-foreground">{occupied}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: "#D6DCD0" }}
          />
          <span className="text-muted-foreground">
            Open <span className="font-medium text-foreground">{available}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default DashboardAdmin;
