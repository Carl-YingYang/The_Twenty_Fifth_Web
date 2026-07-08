"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
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
  CalendarRange,
  Download,
  Repeat,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { StatCard } from "./StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { BOOKING_STATUS_CONFIG } from "@/lib/constants";
import type { ReportSummary } from "@/types";

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#F59E0B",
  CONFIRMED: "#38A169",
  CHECKED_IN: "#1F6F50",
  COMPLETED: "#718096",
  CANCELLED: "#DC2626",
  REJECTED: "#B91C1C",
  NO_SHOW: "#9F1239",
};

export function ReportsAdmin() {
  const [range, setRange] = useState("30");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", range],
    queryFn: () => apiFetch<ReportSummary>(`/api/reports?range=${range}`),
  });

  const statusDistribution = data
    ? [
        { name: "Pending", value: data.pending, key: "PENDING" },
        { name: "Confirmed", value: data.confirmed, key: "CONFIRMED" },
        { name: "Checked In", value: data.checkedIn ?? 0, key: "CHECKED_IN" },
        { name: "Completed", value: data.completed, key: "COMPLETED" },
        { name: "Cancelled", value: data.cancelled, key: "CANCELLED" },
        { name: "Rejected", value: data.rejected, key: "REJECTED" },
        { name: "No Show", value: data.noShow, key: "NO_SHOW" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <AdminLayout
      title="Reports"
      subtitle="Analytics and performance insights"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5">
            {RANGES.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant={range === r.value ? "default" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setRange(r.value)}
              >
                {r.value}d
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => toast.success("Report exported")}
          >
            <Download className="size-4" />
            Export
          </Button>
        </div>
      }
    >
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarRange}
          label="Total Reservations"
          value={data?.totalReservations ?? 0}
          hint={`${data?.pending ?? 0} pending`}
          accent="emerald"
          loading={isLoading}
        />
        <StatCard
          icon={Wallet}
          label="Total Revenue"
          value={data ? formatCurrency(data.totalRevenue) : "—"}
          hint="Confirmed bookings"
          accent="amber"
          loading={isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Occupancy Rate"
          value={data ? `${data.occupancyRate}%` : "—"}
          hint="Live occupancy"
          accent="sky"
          loading={isLoading}
        />
        <StatCard
          icon={Repeat}
          label="Returning Guests"
          value={data?.guestStats.returning ?? 0}
          hint={`${data?.guestStats.newThisMonth ?? 0} new this month`}
          accent="violet"
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/70 shadow-luxury">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Monthly Reservations</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.monthlyData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#718096" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#718096" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      fontSize: 12,
                    }}
                    cursor={{ fill: "rgba(31,111,80,0.06)" }}
                  />
                  <Bar dataKey="reservations" fill="#1F6F50" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-luxury">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.monthlyData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#718096" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#718096" }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#38A169"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#38A169" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/70 shadow-luxury">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Reservation Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : statusDistribution.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                No reservations in this period
              </div>
            ) : (
              <div className="flex flex-col items-center sm:flex-row">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusDistribution.map((d) => (
                        <Cell key={d.key} fill={STATUS_COLORS[d.key]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid w-full grid-cols-2 gap-2 px-4 pb-2">
                  {statusDistribution.map((d) => (
                    <div key={d.key} className="flex items-center gap-2 text-xs">
                      <span
                        className="size-2.5 rounded"
                        style={{ backgroundColor: STATUS_COLORS[d.key] }}
                      />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="ml-auto font-semibold text-foreground">
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-luxury">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Weekly Reservations</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.weeklyData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1F6F50" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1F6F50" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: "#718096" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#718096" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reservations"
                    stroke="#1F6F50"
                    strokeWidth={2.5}
                    fill="url(#grad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Highlight cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/70 shadow-luxury">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Most Booked Room</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : data?.mostBookedRoom ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl font-bold text-emerald-700">
                  ★
                </div>
                <div>
                  <div className="font-display text-lg font-semibold text-foreground">
                    {data.mostBookedRoom.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data.mostBookedRoom.count} reservations
                  </div>
                </div>
              </motion.div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not enough data yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-luxury">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Guest Statistics</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="flex justify-center text-emerald-700">
                    <Users className="size-4" />
                  </div>
                  <div className="mt-1 font-display text-2xl font-semibold text-foreground">
                    {data?.guestStats.total ?? 0}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Total
                  </div>
                </div>
                <div>
                  <div className="flex justify-center text-amber-600">
                    <UserPlus className="size-4" />
                  </div>
                  <div className="mt-1 font-display text-2xl font-semibold text-foreground">
                    {data?.guestStats.newThisMonth ?? 0}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    New
                  </div>
                </div>
                <div>
                  <div className="flex justify-center text-violet-600">
                    <Repeat className="size-4" />
                  </div>
                  <div className="mt-1 font-display text-2xl font-semibold text-foreground">
                    {data?.guestStats.returning ?? 0}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Returning
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-luxury">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-1.5">
                {Object.entries(BOOKING_STATUS_CONFIG).map(([key, cfg]) => {
                  const value =
                    key === "PENDING"
                      ? data?.pending
                      : key === "CONFIRMED"
                      ? data?.confirmed
                      : key === "COMPLETED"
                      ? data?.completed
                      : key === "CANCELLED"
                      ? data?.cancelled
                      : key === "REJECTED"
                      ? data?.rejected
                      : key === "NO_SHOW"
                      ? data?.noShow
                      : key === "CHECKED_IN"
                      ? data?.checkedIn ?? 0
                      : 0;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-md px-2 py-1 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span className="text-muted-foreground">{cfg.label}</span>
                      </div>
                      <Badge variant="secondary" className="h-5 px-1.5 tabular-nums">
                        {value ?? 0}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default ReportsAdmin;
