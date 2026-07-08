"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  CheckCircle2,
  Eye,
  LogIn,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  UserX,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { BookingStatusBadge } from "./StatusBadges";
import { EmptyState } from "./StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { apiFetch } from "@/lib/api-client";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDateShort,
  getInitials,
  nightsBetween,
} from "@/lib/utils";
import type { BookingStatus, Reservation, Room } from "@/types";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REJECTED", label: "Rejected" },
  { value: "NO_SHOW", label: "No Show" },
];

export function BookingsAdmin() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Reservation | null>(null);
  const [creating, setCreating] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = new URLSearchParams();
  if (status !== "ALL") queryParams.set("status", status);
  if (debouncedSearch) queryParams.set("search", debouncedSearch);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reservations", status, debouncedSearch],
    queryFn: () =>
      apiFetch<{ reservations: Reservation[] }>(
        `/api/reservations?${queryParams.toString()}`
      ),
  });

  const reservations = data?.reservations ?? [];

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { status: string; rejectedReason?: string };
    }) =>
      apiFetch<{ reservation: Reservation }>(
        `/api/reservations/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("Reservation updated");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to update reservation";
      toast.error(message);
    },
  });

  function updateStatus(res: Reservation, newStatus: BookingStatus) {
    statusMutation.mutate({ id: res.id, payload: { status: newStatus } });
  }

  return (
    <AdminLayout
      title="Bookings"
      subtitle="Manage all reservations"
      actions={
        <Button
          onClick={() => setCreating(true)}
          className="rounded-full bg-primary shadow-sm"
        >
          <Plus className="size-4" />
          New Reservation
        </Button>
      }
    >
      {/* Filter bar */}
      <Card className="rounded-2xl border-border/70 shadow-luxury">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-muted/60 p-1 lg:w-auto">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, guest, email…"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="mt-4 rounded-2xl border-border/70 shadow-luxury">
        <CardContent className="px-0 py-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No reservations found"
              description="Try adjusting your filters or search query."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Reference</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead className="hidden lg:table-cell">Room(s)</TableHead>
                  <TableHead className="hidden md:table-cell">Check-in</TableHead>
                  <TableHead className="hidden md:table-cell">Check-out</TableHead>
                  <TableHead className="hidden xl:table-cell">Nights</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-default"
                  >
                    <TableCell className="pl-6 font-mono text-xs font-medium text-emerald-700">
                      {r.referenceNo}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                            {r.guest
                              ? getInitials(`${r.guest.firstName} ${r.guest.lastName}`)
                              : "G"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">
                            {r.guest
                              ? `${r.guest.firstName} ${r.guest.lastName}`
                              : "Guest"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {r.guest?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {r.rooms?.map((rr) => (
                          <span key={rr.id} className="text-xs text-foreground">
                            {rr.room?.name}{" "}
                            <span className="text-muted-foreground">
                              #{rr.room?.number}
                            </span>
                          </span>
                        )) ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-foreground">
                      {formatDateShort(r.checkIn)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-foreground">
                      {formatDateShort(r.checkOut)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {r.nights}
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums text-foreground">
                      {formatCurrency(r.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Inline quick-action buttons for common transitions */}
                        {r.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                              title="Confirm reservation"
                              onClick={() => updateStatus(r, "CONFIRMED")}
                            >
                              <CheckCircle2 className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                              title="Reject reservation"
                              onClick={() => setRejecting(r)}
                            >
                              <XCircle className="size-4" />
                            </Button>
                          </>
                        )}
                        {r.status === "CONFIRMED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-primary hover:bg-primary/10"
                            title="Check in guest"
                            onClick={() => updateStatus(r, "CHECKED_IN")}
                          >
                            <LogIn className="size-4" />
                          </Button>
                        )}
                        {r.status === "CHECKED_IN" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-primary hover:bg-primary/10"
                            title="Check out / complete"
                            onClick={() => updateStatus(r, "COMPLETED")}
                          >
                            <LogOut className="size-4" />
                          </Button>
                        )}
                        {/* View details */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          title="View details"
                          onClick={() => setDetailsId(r.id)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        {/* More actions dropdown */}
                        <RowActions
                          reservation={r}
                          onView={() => setDetailsId(r.id)}
                          onConfirm={() => updateStatus(r, "CONFIRMED")}
                          onCheckIn={() => updateStatus(r, "CHECKED_IN")}
                          onComplete={() => updateStatus(r, "COMPLETED")}
                          onCancel={() => updateStatus(r, "CANCELLED")}
                          onReject={() => setRejecting(r)}
                          onNoShow={() => updateStatus(r, "NO_SHOW")}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details dialog */}
      <DetailsDialog
        id={detailsId}
        onClose={() => setDetailsId(null)}
      />

      {/* Reject dialog */}
      <RejectDialog
        reservation={rejecting}
        onClose={() => setRejecting(null)}
        onConfirm={(reason) => {
          if (rejecting) {
            statusMutation.mutate({
              id: rejecting.id,
              payload: { status: "REJECTED", rejectedReason: reason },
            });
          }
          setRejecting(null);
        }}
        submitting={statusMutation.isPending}
      />

      {/* Create reservation dialog */}
      {creating && (
        <CreateReservationDialog
          onClose={() => setCreating(false)}
          onSuccess={() => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["admin-reservations"] });
            qc.invalidateQueries({ queryKey: ["dashboard"] });
            qc.invalidateQueries({ queryKey: ["calendar"] });
          }}
        />
      )}
    </AdminLayout>
  );
}

function RowActions({
  reservation,
  onView,
  onConfirm,
  onCheckIn,
  onComplete,
  onCancel,
  onReject,
  onNoShow,
}: {
  reservation: Reservation;
  onView: () => void;
  onConfirm: () => void;
  onCheckIn: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onReject: () => void;
  onNoShow: () => void;
}) {
  const status = reservation.status;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={onView}>
          <Eye className="size-4" />
          View details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {status === "PENDING" && (
          <DropdownMenuItem onClick={onConfirm} className="text-emerald-700">
            <CheckCircle2 className="size-4" />
            Confirm reservation
          </DropdownMenuItem>
        )}
        {status === "CONFIRMED" && (
          <DropdownMenuItem onClick={onCheckIn}>
            <LogIn className="size-4" />
            Check in guest
          </DropdownMenuItem>
        )}
        {status === "CHECKED_IN" && (
          <DropdownMenuItem onClick={onComplete}>
            <LogOut className="size-4" />
            Check out / complete
          </DropdownMenuItem>
        )}
        {(status === "PENDING" || status === "CONFIRMED") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onCancel}
              className="text-amber-700 data-[variant=destructive]:text-amber-700"
            >
              <XCircle className="size-4" />
              Cancel reservation
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onReject}
              variant="destructive"
            >
              <UserX className="size-4" />
              Reject with reason
            </DropdownMenuItem>
            {status === "CONFIRMED" && (
              <DropdownMenuItem onClick={onNoShow} className="text-amber-700">
                <UserX className="size-4" />
                Mark as no-show
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DetailsDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["reservation", id],
    queryFn: () =>
      id
        ? apiFetch<{ reservation: Reservation }>(`/api/reservations/${id}`)
        : Promise.reject(new Error("no id")),
    enabled: !!id,
  });

  const r = data?.reservation;

  return (
    <Dialog open={!!id} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b p-6">
          <DialogTitle className="flex items-center gap-2 text-base">
            {r ? (
              <>
                <span className="font-mono text-sm text-emerald-700">
                  {r.referenceNo}
                </span>
                <BookingStatusBadge status={r.status} />
              </>
            ) : (
              "Reservation details"
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Full reservation information
          </DialogDescription>
        </DialogHeader>

        {isLoading || !r ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailBlock label="Guest">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-emerald-50 text-xs font-semibold text-emerald-700">
                      {r.guest ? getInitials(`${r.guest.firstName} ${r.guest.lastName}`) : "G"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {r.guest?.firstName} {r.guest?.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.guest?.email}</div>
                    <div className="text-xs text-muted-foreground">{r.guest?.phone}</div>
                  </div>
                </div>
              </DetailBlock>
              <DetailBlock label="Stay">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="font-medium">{formatDate(r.checkIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="font-medium">{formatDate(r.checkOut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nights</span>
                    <span className="font-medium">{r.nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guests</span>
                    <span className="font-medium">
                      {r.adults} adults · {r.children} children
                    </span>
                  </div>
                </div>
              </DetailBlock>
            </div>

            <Separator className="my-4" />

            <DetailBlock label="Rooms">
              <div className="space-y-2">
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
                        {formatCurrency(rr.pricePerNight)} / night
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DetailBlock>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailBlock label="Special requests">
                <p className="text-sm text-foreground">
                  {r.specialRequests || "None"}
                </p>
              </DetailBlock>
              <DetailBlock label="Total amount">
                <div className="font-display text-2xl font-semibold text-foreground">
                  {formatCurrency(r.totalAmount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Source: {r.source}
                </div>
              </DetailBlock>
            </div>

            <Separator className="my-4" />

            <DetailBlock label="Status timeline">
              <ol className="space-y-2">
                <TimelineItem
                  label="Reservation created"
                  date={r.createdAt}
                  done
                />
                <TimelineItem
                  label="Confirmed"
                  date={r.confirmedAt}
                  done={!!r.confirmedAt}
                />
                <TimelineItem
                  label="Checked in"
                  date={r.checkedInAt}
                  done={!!r.checkedInAt}
                />
                <TimelineItem
                  label="Checked out / completed"
                  date={r.checkedOutAt}
                  done={!!r.checkedOutAt}
                />
                {r.cancelledAt && (
                  <TimelineItem
                    label="Cancelled"
                    date={r.cancelledAt}
                    done
                    tone="amber"
                  />
                )}
                {r.rejectedReason && (
                  <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    <span className="font-medium">Rejection reason:</span>{" "}
                    {r.rejectedReason}
                  </div>
                )}
              </ol>
            </DetailBlock>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function TimelineItem({
  label,
  date,
  done,
  tone = "emerald",
}: {
  label: string;
  date: string | null;
  done?: boolean;
  tone?: "emerald" | "amber";
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-[10px] font-semibold",
          done
            ? tone === "emerald"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
            : "bg-muted text-muted-foreground"
        )}
      >
        {done ? "✓" : "·"}
      </span>
      <div className="flex-1">
        <div
          className={cn(
            "text-sm",
            done ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </div>
        {date && (
          <div className="text-xs text-muted-foreground">{formatDateTime(date)}</div>
        )}
      </div>
    </li>
  );
}

function RejectDialog({
  reservation,
  onClose,
  onConfirm,
  submitting,
}: {
  reservation: Reservation | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  submitting: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog
      open={!!reservation}
      onOpenChange={(open) => {
        if (!open) {
          setReason("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject reservation</DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting{" "}
            <span className="font-mono text-emerald-700">
              {reservation?.referenceNo}
            </span>
            . The guest will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            placeholder="e.g. Room unavailable, dates conflict, payment issue…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || submitting}
            onClick={() => onConfirm(reason.trim())}
          >
            Reject reservation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateReservationDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    adults: 2,
    children: 0,
    source: "WALK_IN",
  });
  const [submitting, setSubmitting] = useState(false);

  const { data: roomsData } = useQuery({
    queryKey: ["rooms", "create-res"],
    queryFn: () => apiFetch<{ rooms: Room[] }>("/api/rooms"),
  });
  const rooms = roomsData?.rooms ?? [];

  const selectedRoom = rooms.find((r) => r.id === form.roomId);
  const nights =
    form.checkIn && form.checkOut
      ? Math.max(
          0,
          Math.round(
            (new Date(form.checkOut).getTime() -
              new Date(form.checkIn).getTime()) /
              86400000
          )
        )
      : 0;
  const total = selectedRoom && nights ? selectedRoom.pricePerNight * nights : 0;

  const canSubmit =
    form.firstName &&
    form.lastName &&
    form.email &&
    form.phone &&
    form.roomId &&
    form.checkIn &&
    form.checkOut &&
    nights > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedRoom) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
          roomId: form.roomId,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          adults: form.adults,
          children: form.children,
          guest: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
          },
          specialRequests: `Created by admin (${form.source})`,
        }),
      });
      toast.success("Reservation created successfully");
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create reservation";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Reservation</DialogTitle>
          <DialogDescription>
            Create a walk-in or phone reservation. The guest will be saved to the
            guest directory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Guest info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">First name *</Label>
              <Input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                placeholder="Juan"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Last name *</Label>
              <Input
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
                placeholder="Dela Cruz"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="juan@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+63 917 000 0000"
              />
            </div>
          </div>

          <Separator />

          {/* Stay info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Check-in *</Label>
              <Input
                type="date"
                value={form.checkIn}
                onChange={(e) =>
                  setForm({ ...form, checkIn: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Check-out *</Label>
              <Input
                type="date"
                value={form.checkOut}
                onChange={(e) =>
                  setForm({ ...form, checkOut: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Room *</Label>
            <Select
              value={form.roomId}
              onValueChange={(v) => setForm({ ...form, roomId: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} (#{r.number}) — {formatCurrency(r.pricePerNight)}
                    /night
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Adults</Label>
              <Input
                type="number"
                min={1}
                value={form.adults}
                onChange={(e) =>
                  setForm({ ...form, adults: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Children</Label>
              <Input
                type="number"
                min={0}
                value={form.children}
                onChange={(e) =>
                  setForm({ ...form, children: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {nights} night{nights > 1 ? "s" : ""} ×{" "}
                {formatCurrency(selectedRoom?.pricePerNight ?? 0)}
              </span>
              <span className="font-display text-lg font-semibold">
                {formatCurrency(total)}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
            className="bg-primary"
          >
            {submitting ? "Creating…" : "Create Reservation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BookingsAdmin;
