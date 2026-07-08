"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  CalendarCheck,
  Clock,
  DoorOpen,
  LogIn,
  LogOut,
  Plus,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { AdminLayout } from "./AdminLayout";
import { StatCard, EmptyState } from "./StatCard";
import { BookingStatusBadge } from "./StatusBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatDateShort, getInitials, timeAgo } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { useViewStore } from "@/store/useViewStore";
import type { DashboardStats } from "@/types";

export function DashboardAdmin() {
  const { navigate } = useViewStore();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardStats>("/api/dashboard"),
    refetchInterval: 60 * 1000,
  });

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Today at a glance"
      actions={
        <Button
          size="sm"
          className="hidden h-9 gap-1.5 sm:inline-flex"
          onClick={() => navigate("admin-bookings")}
        >
          <Plus className="size-4" />
          New Booking
        </Button>
      }
    >
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={LogIn}
          label="Today's Arrivals"
          value={data?.arrivalsToday ?? 0}
          hint="Guests checking in"
          accent="emerald"
          loading={isLoading}
        />
        <StatCard
          icon={LogOut}
          label="Today's Departures"
          value={data?.departuresToday ?? 0}
          hint="Guests checking out"
          accent="amber"
          loading={isLoading}
        />
        <StatCard
          icon={Clock}
          label="Pending Reservations"
          value={data?.pendingReservations ?? 0}
          hint="Awaiting confirmation"
          accent="violet"
          loading={isLoading}
        />
        <StatCard
          icon={DoorOpen}
          label="Available Rooms"
          value={data ? `${data.availableRooms}/${data.totalRooms}` : "—"}
          hint={`${data?.occupiedRooms ?? 0} occupied`}
          accent="sky"
          loading={isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Occupancy Rate"
          value={data ? `${data.occupancyRate}%` : "—"}
          hint={`Revenue today: ${data ? formatCurrency(data.revenueToday) : "—"}`}
          accent="rose"
          loading={isLoading}
        />
      </div>

      {/* Timeline + Occupancy donut */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/70 shadow-luxury lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between border-b">
            <CardTitle className="text-base">Today's Timeline</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-emerald-700 hover:text-emerald-800"
              onClick={() => navigate("admin-bookings")}
            >
              View all
              <ArrowRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-0 px-0 py-0 sm:grid-cols-2">
            <TimelineColumn
              title="Arrivals"
              icon={LogIn}
              accent="emerald"
              loading={isLoading}
              items={(data?.todayTimeline.arrivals ?? []).map((r) => ({
                id: r.id,
                name: r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : "Guest",
                subtitle: r.rooms?.[0]?.room?.name ?? "Room",
                time: r.checkIn,
                reference: r.referenceNo,
              }))}
            />
            <Separator orientation="vertical" className="hidden sm:block" />
            <TimelineColumn
              title="Departures"
              icon={LogOut}
              accent="amber"
              loading={isLoading}
              items={(data?.todayTimeline.departures ?? []).map((r) => ({
                id: r.id,
                name: r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : "Guest",
                subtitle: r.rooms?.[0]?.room?.name ?? "Room",
                time: r.checkOut,
                reference: r.referenceNo,
              }))}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-luxury">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Occupancy Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <Skeleton className="mx-auto h-48 w-48 rounded-full" />
            ) : (
              <OccupancyDonut data={data} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings */}
      <Card className="mt-6 rounded-2xl border-border/70 shadow-luxury">
        <CardHeader className="flex-row items-center justify-between border-b">
          <CardTitle className="text-base">Recent Bookings</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-emerald-700 hover:text-emerald-800"
            onClick={() => navigate("admin-bookings")}
          >
            View all
            <ArrowRight className="size-3" />
          </Button>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (data?.recentBookings ?? []).length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No recent bookings"
              description="New reservations will appear here as they come in."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Reference</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead className="hidden md:table-cell">Room</TableHead>
                  <TableHead className="hidden md:table-cell">Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.recentBookings ?? []).map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate("admin-bookings", { id: r.id })
                    }
                  >
                    <TableCell className="pl-6 font-mono text-xs font-medium text-emerald-700">
                      {r.referenceNo}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                            {r.guest ? getInitials(`${r.guest.firstName} ${r.guest.lastName}`) : "G"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">
                            {r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : "Guest"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {r.guest?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm text-foreground">
                        {r.rooms?.[0]?.room?.name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.rooms?.[0]?.room?.number ? `#${r.rooms[0].room.number}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm text-foreground">
                        {formatDateShort(r.checkIn)} → {formatDateShort(r.checkOut)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.nights} {r.nights === 1 ? "night" : "nights"} · {timeAgo(r.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(r.totalAmount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <QuickAction
          icon={CalendarCheck}
          title="New Booking"
          description="Create a reservation"
          onClick={() => navigate("admin-bookings")}
          accent="bg-emerald-50 text-emerald-700"
        />
        <QuickAction
          icon={BedDouble}
          title="Add Room"
          description="Configure a new room"
          onClick={() => navigate("admin-rooms")}
          accent="bg-sky-50 text-sky-700"
        />
        <QuickAction
          icon={CalendarCheck}
          title="View Calendar"
          description="See all reservations"
          onClick={() => navigate("admin-calendar")}
          accent="bg-amber-50 text-amber-700"
        />
        <QuickAction
          icon={TrendingUp}
          title="Reports"
          description="Analytics & insights"
          onClick={() => navigate("admin-reports")}
          accent="bg-violet-50 text-violet-700"
        />
      </div>
    </AdminLayout>
  );
}

function TimelineColumn({
  title,
  icon: Icon,
  accent,
  items,
  loading,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "emerald" | "amber";
  items: {
    id: string;
    name: string;
    subtitle: string;
    time: string;
    reference: string;
  }[];
  loading?: boolean;
}) {
  const dotColor = accent === "emerald" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <div className="px-5 py-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn("size-4", accent === "emerald" ? "text-emerald-600" : "text-amber-600")} />
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {items.length}
        </span>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon className="size-3.5" />
          </div>
          <p className="text-xs text-muted-foreground">No {title.toLowerCase()} today</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
            >
              <span className={cn("mt-1 size-2 shrink-0 rounded-full", dotColor)} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{item.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {item.subtitle} · {item.reference}
                </div>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                {new Date(item.time).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OccupancyDonut({ data }: { data?: DashboardStats }) {
  const occupied = data?.occupiedRooms ?? 0;
  const available = data?.availableRooms ?? 0;
  const total = data?.totalRooms ?? 0;
  const other = Math.max(0, total - occupied - available);

  const pieData = [
    { name: "Occupied", value: occupied, color: "#1F6F50" },
    { name: "Available", value: available, color: "#38A169" },
    { name: "Other", value: other, color: "#E2E8F0" },
  ].filter((d) => d.value > 0);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              innerRadius={58}
              outerRadius={84}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {pieData.map((d, i) => (
                <Cell key={i} fill={d.color} />
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
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-3xl font-semibold text-foreground">
            {data?.occupancyRate ?? 0}%
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Occupied
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
        {pieData.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-semibold text-foreground">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  accent,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left shadow-luxury transition-colors hover:border-emerald-200"
    >
      <div className={cn("flex size-10 items-center justify-center rounded-xl", accent)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{description}</div>
      </div>
      <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-emerald-600" />
    </motion.button>
  );
}

export default DashboardAdmin;
