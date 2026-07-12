"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Download,
  TrendingUp,
  CalendarDays,
  BedDouble,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { StatCard } from "./StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { BOOKING_STATUS_CONFIG } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import type { ReportSummary, Reservation } from "@/types";

const RANGE_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#D9943C",
  CONFIRMED: "#2E8B6F",
  CHECKED_IN: "#0E5A6F",
  COMPLETED: "#6B7A7E",
  CANCELLED: "#C0392B",
  REJECTED: "#9F1239",
  NO_SHOW: "#9F1239",
};

export function ReportsAdmin() {
  const [range, setRange] = useState<number>(30);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", range],
    queryFn: () =>
      apiFetch<ReportSummary>(`/api/reports?range=${range}`),
  });

  // Also fetch reservations for CSV export
  const { data: reservationsData } = useQuery({
    queryKey: ["admin-reservations", "reports-export"],
    queryFn: () =>
      apiFetch<{ reservations: Reservation[] }>(
        `/api/reservations?limit=500`
      ),
  });

  const avgStay = useMemo(() => {
    if (!reservationsData?.reservations?.length) return 0;
    const completed = reservationsData.reservations.filter((r) =>
      ["COMPLETED", "CHECKED_IN", "CONFIRMED"].includes(r.status)
    );
    if (completed.length === 0) return 0;
    const totalNights = completed.reduce((sum, r) => sum + r.nights, 0);
    return Math.round((totalNights / completed.length) * 10) / 10;
  }, [reservationsData]);

  // Status distribution for donut
  const statusData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Confirmed", value: data.confirmed, key: "CONFIRMED" },
      { name: "Pending", value: data.pending, key: "PENDING" },
      { name: "Completed", value: data.completed, key: "COMPLETED" },
      { name: "Cancelled", value: data.cancelled, key: "CANCELLED" },
      { name: "Declined", value: data.rejected, key: "REJECTED" },
      { name: "No show", value: data.noShow, key: "NO_SHOW" },
    ].filter((d) => d.value > 0);
  }, [data]);

  // Monthly data
  const monthlyData = data?.monthlyData ?? [];

  // Weekly bookings trend
  const weeklyData = data?.weeklyData ?? [];

  // Room type popularity (from reservations)
  const roomTypeData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of reservationsData?.reservations ?? []) {
      const roomName = r.rooms?.[0]?.room?.name ?? "Unknown";
      counts.set(roomName, (counts.get(roomName) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [reservationsData]);

  function exportCsv() {
    const reservations = reservationsData?.reservations ?? [];
    if (reservations.length === 0) {
      toast.error("No reservations to export.");
      return;
    }

    const headers = [
      "Reference",
      "Guest",
      "Email",
      "Check in",
      "Check out",
      "Nights",
      "Room",
      "Adults",
      "Children",
      "Total (PHP)",
      "Status",
      "Created at",
    ];

    const rows = reservations.map((r) => [
      r.referenceNo,
      `${r.guest?.firstName ?? ""} ${r.guest?.lastName ?? ""}`.trim(),
      r.guest?.email ?? "",
      formatDate(r.checkIn),
      formatDate(r.checkOut),
      r.nights,
      r.rooms?.[0]?.room?.name ?? "",
      r.adults,
      r.children,
      r.totalAmount,
      BOOKING_STATUS_CONFIG[r.status]?.label ?? r.status,
      formatDate(r.createdAt),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "");
            // Escape quotes and wrap in quotes if needed
            if (/[",\n]/.test(s)) {
              return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `the-25th-reservations-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded.");
  }

  return (
    <AdminLayout title="Reports" subtitle="Performance insights for the villa">
      {/* Range + export */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 self-start rounded-md border border-border bg-card p-1">
          {RANGE_OPTIONS.map((opt) => {
            const active = range === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={cn(
                  "min-h-[36px] rounded-md px-3.5 text-xs font-medium transition-colors",
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
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-full sm:w-auto"
          onClick={exportCsv}
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Total revenue"
          value={formatCurrency(data?.totalRevenue ?? 0)}
          loading={isLoading}
          hint={`Last ${range} days`}
          deltaTone="up"
        />
        <StatCard
          icon={CalendarDays}
          label="Reservations"
          value={data?.totalReservations ?? 0}
          loading={isLoading}
          hint={`Last ${range} days`}
        />
        <StatCard
          icon={BedDouble}
          label="Avg stay"
          value={`${avgStay} nights`}
          loading={isLoading}
          hint="Across active stays"
        />
        <StatCard
          icon={TrendingUp}
          label="Occupancy"
          value={`${data?.occupancyRate ?? 0}%`}
          loading={isLoading}
          hint="Right now"
          deltaTone={data && data.occupancyRate > 50 ? "up" : "neutral"}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 pb-6 lg:grid-cols-2">
        {/* Monthly revenue */}
        <Card className="rounded-lg border border-border p-5 shadow-card">
          <div className="mb-4">
            <div className="eyebrow">Last 12 months</div>
            <h3 className="mt-1 font-display text-lg font-medium tracking-tight">
              Revenue by month
            </h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5DED0"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#6B7A7E" }}
                  axisLine={{ stroke: "#E5DED0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6B7A7E" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₱${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                  contentStyle={{
                    borderRadius: 5,
                    border: "1px solid #E5DED0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="revenue" fill="#0E5A6F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Bookings trend */}
        <Card className="rounded-lg border border-border p-5 shadow-card">
          <div className="mb-4">
            <div className="eyebrow">Last 8 weeks</div>
            <h3 className="mt-1 font-display text-lg font-medium tracking-tight">
              Bookings trend
            </h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={weeklyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5DED0"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#6B7A7E" }}
                  axisLine={{ stroke: "#E5DED0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6B7A7E" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(v: number) => [v, "Bookings"]}
                  contentStyle={{
                    borderRadius: 5,
                    border: "1px solid #E5DED0",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="reservations"
                  stroke="#E27D60"
                  strokeWidth={2}
                  dot={{ fill: "#E27D60", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Status distribution */}
        <Card className="rounded-lg border border-border p-5 shadow-card">
          <div className="mb-4">
            <div className="eyebrow">Distribution</div>
            <h3 className="mt-1 font-display text-lg font-medium tracking-tight">
              Reservation statuses
            </h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : statusData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No reservations in this period.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {statusData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={STATUS_COLORS[entry.key] ?? "#6B7A7E"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 5,
                        border: "1px solid #E5DED0",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-1.5">
                {statusData.map((s) => (
                  <li
                    key={s.key}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[s.key] }}
                    />
                    <span className="flex-1 text-foreground">{s.name}</span>
                    <span className="font-medium text-foreground">
                      {s.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Room popularity */}
        <Card className="rounded-lg border border-border p-5 shadow-card">
          <div className="mb-4">
            <div className="eyebrow">Most booked</div>
            <h3 className="mt-1 font-display text-lg font-medium tracking-tight">
              Room popularity
            </h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : roomTypeData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No reservation data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roomTypeData} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5DED0"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#6B7A7E" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#6B7A7E" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(v: number) => [v, "Bookings"]}
                  contentStyle={{
                    borderRadius: 5,
                    border: "1px solid #E5DED0",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#2E8B6F"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

export default ReportsAdmin;
