"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarPlus,
  Check,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  LogIn,
  LogOut,
  Plus,
  Search,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { ConfirmDialog, type ConfirmTone } from "./ConfirmDialog";
import { BookingStatusBadge } from "./StatusBadges";
import { EmptyState } from "./StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { apiFetch, ApiError } from "@/lib/api-client";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateShort,
  formatDateTime,
  getInitials,
  nightsBetween,
} from "@/lib/utils";
import {
  reservationCreateSchema,
  type ReservationCreateInput,
} from "@/lib/validators";
import type { Reservation, Room, BookingStatus } from "@/types";

const HISTORY_STATUSES: BookingStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "NO_SHOW",
];

const PAGE_SIZE = 8;

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CHECKED_IN", label: "Checked in" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "HISTORY", label: "History" },
];

/** Confirmation metadata for each mutating status transition. */
function getStatusConfirm(
  status: BookingStatus,
  reservation: Reservation
): {
  tone: ConfirmTone;
  title: string;
  description: string;
  confirmLabel: string;
  hint?: string;
} {
  const guest =
    `${reservation.guest?.firstName ?? ""} ${reservation.guest?.lastName ?? ""}`.trim() ||
    "this guest";
  const ref = reservation.referenceNo;
  switch (status) {
    case "CONFIRMED":
      return {
        tone: "success",
        title: "Approve this reservation?",
        description: `You're about to confirm ${ref} for ${guest}. The room will be held for their dates and the guest will receive a confirmation email.`,
        confirmLabel: "Approve reservation",
        hint: "The guest will be notified by email.",
      };
    case "REJECTED":
      return {
        tone: "destructive",
        title: "Decline this reservation?",
        description: `Declining ${ref} (${guest}) releases the held dates back to availability. The guest will be notified that their booking could not be accommodated.`,
        confirmLabel: "Decline reservation",
        hint: "This cannot be undone.",
      };
    case "CHECKED_IN":
      return {
        tone: "info",
        title: "Check in this guest?",
        description: `Mark ${guest} (${ref}) as checked in. This records the actual arrival and starts the stay.`,
        confirmLabel: "Check in guest",
      };
    case "COMPLETED":
      return {
        tone: "warning",
        title: "Check out this guest?",
        description: `Check out ${guest} (${ref}) and close this stay. The room returns to available inventory and the reservation becomes part of history.`,
        confirmLabel: "Check out guest",
        hint: "This cannot be undone.",
      };
    default:
      return {
        tone: "info",
        title: "Update this reservation?",
        description: `Apply a status change to ${ref}.`,
        confirmLabel: "Update reservation",
      };
  }
}

/** Count reservations visible under a given tab (History aggregates 4 statuses). */
function countForTab(tab: string, reservations: Reservation[]): number {
  if (tab === "ALL") return reservations.length;
  if (tab === "HISTORY") {
    return reservations.filter((r) =>
      HISTORY_STATUSES.includes(r.status as BookingStatus)
    ).length;
  }
  return reservations.filter((r) => r.status === tab).length;
}

/** Build a compact page range with ellipses for large page counts. */
function getPageRange(
  current: number,
  total: number
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", total];
  }
  if (current >= total - 3) {
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

export function BookingsAdmin() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    reservation: Reservation;
    status: BookingStatus;
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch all reservations (server-side search only); status filtering and
  // pagination are handled client-side so the History tab can aggregate
  // multiple statuses and every tab count stays accurate.
  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.set("search", debouncedSearch);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reservations", debouncedSearch],
    queryFn: () =>
      apiFetch<{ reservations: Reservation[] }>(
        `/api/reservations?${queryParams.toString()}`
      ),
  });

  const allReservations = data?.reservations ?? [];

  // Client-side status filtering (supports the aggregated History tab).
  const filteredReservations = useMemo(() => {
    if (status === "ALL") return allReservations;
    if (status === "HISTORY") {
      return allReservations.filter((r) =>
        HISTORY_STATUSES.includes(r.status as BookingStatus)
      );
    }
    return allReservations.filter((r) => r.status === status);
  }, [allReservations, status]);

  // Client-side pagination.
  const totalPages = Math.max(
    1,
    Math.ceil(filteredReservations.length / PAGE_SIZE)
  );
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, filteredReservations.length);
  const paginatedReservations = filteredReservations.slice(startIdx, endIdx);
  const goToPage = (p: number) =>
    setPage(Math.min(Math.max(1, p), totalPages));

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      rejectedReason,
    }: {
      id: string;
      status: BookingStatus;
      rejectedReason?: string;
    }) =>
      apiFetch<{ reservation: Reservation }>(
        `/api/reservations/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, rejectedReason }),
        }
      ),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      qc.invalidateQueries({ queryKey: ["admin-calendar"] });
      qc.invalidateQueries({ queryKey: ["admin-rooms"] });
      toast.success(`Reservation ${data.reservation.referenceNo} updated.`);
      // Email notification simulation
      const guestEmail = data.reservation.guest?.email;
      if (guestEmail) {
        const emailMap: Record<string, string> = {
          CONFIRMED: `✉️ Confirmation email sent to ${guestEmail}`,
          CHECKED_IN: `✉️ Check-in confirmation sent to ${guestEmail}`,
          COMPLETED: `✉️ Thank-you email sent to ${guestEmail}`,
          CANCELLED: `✉️ Cancellation notice sent to ${guestEmail}`,
          REJECTED: `✉️ Cancellation notice sent to ${guestEmail}`,
          NO_SHOW: `✉️ No-show notice sent to ${guestEmail}`,
        };
        const msg = emailMap[data.reservation.status];
        if (msg) setTimeout(() => toast.info(msg), 800);
      }
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Couldn't update reservation.";
      toast.error(message);
    },
  });

  const confirmStatus = async () => {
    if (!pendingAction) return;
    try {
      await statusMutation.mutateAsync({
        id: pendingAction.reservation.id,
        status: pendingAction.status,
      });
      setPendingAction(null);
    } catch {
      // error toast already shown by mutation onError; keep dialog open for retry
    }
  };

  const confirmMeta = pendingAction
    ? getStatusConfirm(pendingAction.status, pendingAction.reservation)
    : null;

  const selected = allReservations.find((r) => r.id === detailsId) ?? null;

  return (
    <AdminLayout
      title="Reservations"
      subtitle="Review and manage all guest bookings"
    >
      {/* Filter bar */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.value;
            const count = countForTab(tab.value, allReservations);
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
                className={cn(
                  "min-h-[36px] rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.value !== "ALL" && count > 0 && (
                  <span className={cn("ml-1.5 text-xs font-bold", active ? "text-primary-foreground" : "text-muted-foreground")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <div className="relative flex-1 sm:w-56 sm:flex-none lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or ref"
              className="h-9 pl-9"
            />
          </div>
          <Button
            onClick={() => setCreating(true)}
            className="h-9 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Reservation</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Table — desktop / tablet */}
      <Card className="hidden overflow-hidden rounded-lg border border-border shadow-card md:block">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reference
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Guest
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dates
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Room
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nights
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredReservations.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-12">
                  <EmptyState
                    icon={CalendarPlus}
                    title="No reservations found"
                    description="Try adjusting your filters, or create a new reservation."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedReservations.map((r) => (
                <TableRow key={r.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.referenceNo}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7 border border-border">
                        <AvatarFallback className="bg-sand text-[10px] font-semibold text-primary">
                          {r.guest
                            ? getInitials(
                                `${r.guest.firstName} ${r.guest.lastName}`
                              )
                            : "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {r.guest?.firstName} {r.guest?.lastName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {r.guest?.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {formatDateShort(r.checkIn)}
                    <span className="mx-1 text-muted-foreground">→</span>
                    {formatDateShort(r.checkOut)}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {r.rooms?.[0]?.room?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {r.nights}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {formatCurrency(r.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <BookingStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      reservation={r}
                      onView={() => setDetailsId(r.id)}
                      onMutate={(s) =>
                        setPendingAction({ reservation: r, status: s })
                      }
                      pending={statusMutation.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Card list — mobile */}
      <div className="space-y-3 md:hidden pb-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))
        ) : filteredReservations.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="No reservations found"
            description="Try adjusting your filters, or create a new reservation."
          />
        ) : (
          paginatedReservations.map((r) => (
            <Card
              key={r.id}
              className="rounded-lg border border-border p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {r.guest?.firstName} {r.guest?.lastName}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {r.referenceNo}
                  </div>
                </div>
                <BookingStatusBadge status={r.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
                <dt className="text-muted-foreground">Dates</dt>
                <dd className="text-right text-foreground">
                  {formatDateShort(r.checkIn)} → {formatDateShort(r.checkOut)}
                </dd>
                <dt className="text-muted-foreground">Room</dt>
                <dd className="text-right text-foreground">
                  {r.rooms?.[0]?.room?.name ?? "—"}
                </dd>
                <dt className="text-muted-foreground">Nights</dt>
                <dd className="text-right text-foreground">{r.nights}</dd>
                <dt className="text-muted-foreground">Total</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatCurrency(r.totalAmount)}
                </dd>
              </dl>
              <div className="mt-3 border-t border-border pt-3">
                <RowActions
                  reservation={r}
                  onView={() => setDetailsId(r.id)}
                  onMutate={(s) =>
                    setPendingAction({ reservation: r, status: s })
                  }
                  pending={statusMutation.isPending}
                  fullWidth
                />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination + summary (shared across desktop table and mobile cards) */}
      {!isLoading && filteredReservations.length > 0 && (
        <div className="mt-4 flex flex-col items-center gap-3 pb-2">
          <p className="text-xs text-muted-foreground">
            Showing {startIdx + 1}–{endIdx} of {filteredReservations.length}{" "}
            bookings
          </p>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent className="flex-wrap">
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    aria-label="Go to first page"
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(1);
                    }}
                    className={cn(
                      "cursor-pointer",
                      safePage === 1 && "pointer-events-none opacity-50"
                    )}
                  >
                    <ChevronsLeft className="size-4" />
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(safePage - 1);
                    }}
                    className={cn(
                      "cursor-pointer",
                      safePage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                {getPageRange(safePage, totalPages).map((p, i) =>
                  p === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === safePage}
                        onClick={(e) => {
                          e.preventDefault();
                          goToPage(p);
                        }}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(safePage + 1);
                    }}
                    className={cn(
                      "cursor-pointer",
                      safePage === totalPages &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    aria-label="Go to last page"
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(totalPages);
                    }}
                    className={cn(
                      "cursor-pointer",
                      safePage === totalPages &&
                        "pointer-events-none opacity-50"
                    )}
                  >
                    <ChevronsRight className="size-4" />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* Details dialog */}
      {selected && (
        <ReservationDetailsDialog
          reservation={selected}
          open={!!selected}
          onClose={() => setDetailsId(null)}
          onMutate={(s) => {
            setPendingAction({ reservation: selected, status: s });
            setDetailsId(null);
          }}
          pending={statusMutation.isPending}
        />
      )}

      {/* Create dialog */}
      <CreateReservationDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          qc.invalidateQueries({ queryKey: ["admin-reservations"] });
          qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
        }}
      />

      {/* Status-change confirmation (shared by table rows, mobile cards, and the details dialog) */}
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
    </AdminLayout>
  );
}

function RowActions({
  reservation,
  onView,
  onMutate,
  pending,
  fullWidth,
}: {
  reservation: Reservation;
  onView: () => void;
  onMutate: (status: BookingStatus) => void;
  pending: boolean;
  fullWidth?: boolean;
}) {
  const s = reservation.status as BookingStatus;
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-1.5",
        fullWidth && "w-full"
      )}
    >
      {s === "PENDING" && (
        <>
          <Button
            size="sm"
            className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={pending}
            onClick={() => onMutate("CONFIRMED")}
          >
            <Check className="size-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
            disabled={pending}
            onClick={() => onMutate("REJECTED")}
          >
            <X className="size-3.5" />
            Decline
          </Button>
        </>
      )}
      {s === "CONFIRMED" && (
        <Button
          size="sm"
          className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={pending}
          onClick={() => onMutate("CHECKED_IN")}
        >
          <LogIn className="size-3.5" />
          Check in
        </Button>
      )}
      {s === "CHECKED_IN" && (
        <Button
          size="sm"
          className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={pending}
          onClick={() => onMutate("COMPLETED")}
        >
          <LogOut className="size-3.5" />
          Check out
        </Button>
      )}
      {(s === "COMPLETED" ||
        s === "CANCELLED" ||
        s === "REJECTED" ||
        s === "NO_SHOW") && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-foreground hover:bg-muted"
          onClick={onView}
        >
          <Eye className="size-3.5" />
          View
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        className={cn("h-8 text-foreground hover:bg-muted", fullWidth && "flex-1")}
        onClick={onView}
      >
        <Eye className="size-3.5" />
        Details
      </Button>
    </div>
  );
}

function ReservationDetailsDialog({
  reservation,
  open,
  onClose,
  onMutate,
  pending,
}: {
  reservation: Reservation;
  open: boolean;
  onClose: () => void;
  onMutate: (status: BookingStatus) => void;
  pending: boolean;
}) {
  const s = reservation.status as BookingStatus;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b border-border px-4 py-5 sm:px-6">
          <DialogTitle className="font-display text-xl font-medium tracking-tight">
            Reservation details
          </DialogTitle>
          <DialogDescription className="text-xs break-all">
            Reference{" "}
            <span className="font-mono text-foreground">
              {reservation.referenceNo}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-4 py-5 sm:px-6">
          {/* Status & timeline */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={reservation.status} friendly />
            <span className="text-xs text-muted-foreground">
              Created {formatDate(reservation.createdAt)}
            </span>
          </div>

          {/* Guest */}
          <Section title="Guest">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border border-border">
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
          </Section>

          {/* Stay */}
          <Section title="Stay">
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Check in</dt>
              <dd className="text-right text-foreground">
                {formatDate(reservation.checkIn)}
              </dd>
              <dt className="text-muted-foreground">Check out</dt>
              <dd className="text-right text-foreground">
                {formatDate(reservation.checkOut)}
              </dd>
              <dt className="text-muted-foreground">Nights</dt>
              <dd className="text-right text-foreground">
                {reservation.nights}
              </dd>
              <dt className="text-muted-foreground">Guests</dt>
              <dd className="text-right text-foreground">
                {reservation.adults} adults
                {reservation.children > 0 &&
                  `, ${reservation.children} children`}
              </dd>
              <dt className="text-muted-foreground">Room</dt>
              <dd className="text-right text-foreground">
                {reservation.rooms?.[0]?.room?.name ?? "—"}
              </dd>
            </dl>
          </Section>

          {/* Price */}
          <Section title="Price breakdown">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {reservation.rooms?.[0]?.pricePerNight != null
                    ? formatCurrency(reservation.rooms[0].pricePerNight)
                    : "—"}{" "}
                  × {reservation.nights} nights
                </dt>
                <dd className="text-foreground">
                  {formatCurrency(reservation.totalAmount)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 text-base font-medium">
                <dt>Total</dt>
                <dd>{formatCurrency(reservation.totalAmount)}</dd>
              </div>
            </dl>
          </Section>

          {reservation.specialRequests && (
            <Section title="Special requests">
              <p className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
                {reservation.specialRequests}
              </p>
            </Section>
          )}

          {/* Status timeline */}
          <Section title="Timeline">
            <ul className="space-y-0">
              <TimelineItem
                label="Booking received"
                date={reservation.createdAt}
                done
              />
              {s === "CANCELLED" ? (
                <TimelineItem
                  label="Cancelled"
                  date={reservation.cancelledAt ?? reservation.updatedAt}
                  done
                  tone="danger"
                  isLast
                />
              ) : s === "REJECTED" ? (
                <TimelineItem
                  label="Declined"
                  date={reservation.updatedAt}
                  done
                  tone="danger"
                  isLast
                />
              ) : s === "NO_SHOW" ? (
                <TimelineItem
                  label="Marked no-show"
                  date={reservation.updatedAt}
                  done
                  tone="warning"
                  isLast
                />
              ) : (
                <>
                  <TimelineItem
                    label="Confirmed"
                    date={reservation.confirmedAt}
                    done={!!reservation.confirmedAt}
                    skipped={s !== "CONFIRMED" && s !== "CHECKED_IN" && s !== "CHECKED_OUT" && s !== "COMPLETED" && !reservation.confirmedAt}
                  />
                  <TimelineItem
                    label="Checked in"
                    date={reservation.checkedInAt}
                    done={!!reservation.checkedInAt}
                    skipped={s === "COMPLETED" && !reservation.checkedInAt}
                  />
                  <TimelineItem
                    label="Checked out / Completed"
                    date={reservation.checkedOutAt ?? (s === "COMPLETED" ? reservation.updatedAt : null)}
                    done={s === "COMPLETED" || !!reservation.checkedOutAt}
                    isLast
                  />
                </>
              )}
            </ul>
          </Section>
        </div>

        <DialogFooter className="flex-row flex-wrap gap-2 border-t border-border px-4 py-4 sm:px-6">
          {s === "PENDING" && (
            <>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40 sm:w-auto"
                disabled={pending}
                onClick={() => onMutate("REJECTED")}
              >
                <UserX className="size-4" />
                Decline
              </Button>
              <Button
                className="ml-auto w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                disabled={pending}
                onClick={() => onMutate("CONFIRMED")}
              >
                <Check className="size-4" />
                Approve
              </Button>
            </>
          )}
          {s === "CONFIRMED" && (
            <Button
              className="ml-auto w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
              disabled={pending}
              onClick={() => onMutate("CHECKED_IN")}
            >
              <LogIn className="size-4" />
              Check in
            </Button>
          )}
          {s === "CHECKED_IN" && (
            <Button
              className="ml-auto w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
              disabled={pending}
              onClick={() => onMutate("COMPLETED")}
            >
              <LogOut className="size-4" />
              Check out
            </Button>
          )}
          {(s === "COMPLETED" ||
            s === "CANCELLED" ||
            s === "REJECTED" ||
            s === "NO_SHOW") && (
            <Button variant="outline" className="ml-auto w-full sm:w-auto" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}

function TimelineItem({
  label,
  date,
  done,
  skipped,
  tone = "default",
  isLast,
}: {
  label: string;
  date: string | null;
  done: boolean;
  skipped?: boolean;
  tone?: "default" | "danger" | "warning";
  isLast?: boolean;
}) {
  // Choose the dot color + ring based on state
  const dotClass = skipped
    ? "border-muted-foreground/30 bg-card text-muted-foreground/40"
    : done
      ? tone === "danger"
        ? "border-red-500 bg-red-500 text-white"
        : tone === "warning"
          ? "border-amber-500 bg-amber-500 text-white"
          : "border-emerald-500 bg-emerald-500 text-white"
      : "border-border bg-card text-muted-foreground/50";

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {/* Vertical connector — hidden on last item */}
      {!isLast && (
        <span
          className={cn(
            "absolute left-[7px] top-4 h-[calc(100%-0.5rem)] w-px",
            done ? "bg-emerald-500/40" : "bg-border"
          )}
          aria-hidden="true"
        />
      )}
      {/* Dot */}
      <span
        className={cn(
          "z-10 mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border-2",
          dotClass
        )}
      >
        {done && (
          <svg viewBox="0 0 12 12" className="size-2" fill="none">
            <path
              d="M2.5 6.5L5 9L9.5 3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {/* Label + date */}
      <div className="flex flex-1 items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-sm",
            skipped
              ? "text-muted-foreground/50 line-through"
              : done
                ? "font-medium text-foreground"
                : "text-muted-foreground/70"
          )}
        >
          {label}
        </span>
        {date ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDateTime(date)}
          </span>
        ) : (
          <span className="shrink-0 text-xs italic text-muted-foreground/40">
            {skipped ? "skipped" : "pending"}
          </span>
        )}
      </div>
    </li>
  );
}

function CreateReservationDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const qc = useQueryClient();
  const { data: roomsData } = useQuery({
    queryKey: ["admin-rooms", "active"],
    queryFn: () => apiFetch<{ rooms: Room[] }>("/api/rooms"),
    enabled: open,
  });
  const rooms = (roomsData?.rooms ?? []).filter((r) => r.isActive);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReservationCreateInput>({
    resolver: zodResolver(reservationCreateSchema),
    defaultValues: {
      roomId: "",
      checkIn: "",
      checkOut: "",
      adults: 2,
      children: 0,
      guest: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
      },
      specialRequests: "",
    },
  });

  const roomId = watch("roomId");
  const checkIn = watch("checkIn");
  const checkOut = watch("checkOut");
  const selectedRoom = rooms.find((r) => r.id === roomId);
  const nights =
    checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const total = selectedRoom ? selectedRoom.pricePerNight * nights : 0;

  const mutation = useMutation({
    mutationFn: (values: ReservationCreateInput) =>
      apiFetch<{ reservation: Reservation }>("/api/reservations", {
        method: "POST",
        body: JSON.stringify({ ...values, source: "WALK_IN" }),
      }),
    onSuccess: (data) => {
      toast.success(
        `Reservation ${data.reservation.referenceNo} created.`
      );
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      reset();
      onCreated();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : "Couldn't create reservation.";
      toast.error(message);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-4 py-5 sm:px-6">
          <DialogTitle className="font-display text-xl font-medium tracking-tight">
            New reservation
          </DialogTitle>
          <DialogDescription>
            Create a walk-in or phone booking. Status starts as Pending.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex max-h-[70vh] flex-col"
        >
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {/* Guest */}
            <div className="mb-5">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Guest information
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="First name" error={errors.guest?.firstName?.message}>
                  <Input {...register("guest.firstName")} className="h-10" />
                </Field>
                <Field label="Last name" error={errors.guest?.lastName?.message}>
                  <Input {...register("guest.lastName")} className="h-10" />
                </Field>
                <Field label="Email" error={errors.guest?.email?.message}>
                  <Input
                    type="email"
                    {...register("guest.email")}
                    className="h-10"
                  />
                </Field>
                <Field label="Phone" error={errors.guest?.phone?.message}>
                  <Input {...register("guest.phone")} className="h-10" />
                </Field>
                <Field label="City" error={errors.guest?.city?.message}>
                  <Input {...register("guest.city")} className="h-10" />
                </Field>
                <Field label="Country" error={errors.guest?.country?.message}>
                  <Input {...register("guest.country")} className="h-10" />
                </Field>
              </div>
            </div>

            {/* Stay */}
            <div className="mb-5">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Stay details
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Room" error={errors.roomId?.message}>
                  <Select
                    value={roomId}
                    onValueChange={(v) => setValue("roomId", v)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} · {formatCurrency(r.pricePerNight)}/night
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Adults" error={errors.adults?.message}>
                    <Input
                      type="number"
                      min={1}
                      {...register("adults", { valueAsNumber: true })}
                      className="h-10"
                    />
                  </Field>
                  <Field label="Children" error={errors.children?.message}>
                    <Input
                      type="number"
                      min={0}
                      {...register("children", { valueAsNumber: true })}
                      className="h-10"
                    />
                  </Field>
                </div>
                <Field label="Check in" error={errors.checkIn?.message}>
                  <Input
                    type="date"
                    {...register("checkIn")}
                    className="h-10"
                  />
                </Field>
                <Field label="Check out" error={errors.checkOut?.message}>
                  <Input
                    type="date"
                    {...register("checkOut")}
                    className="h-10"
                  />
                </Field>
              </div>
            </div>

            {/* Special requests */}
            <Field
              label="Special requests (optional)"
              error={errors.specialRequests?.message}
            >
              <Textarea
                {...register("specialRequests")}
                rows={2}
                placeholder="Late check-in, birthday cake, extra towels…"
              />
            </Field>

            {/* Price summary */}
            {selectedRoom && nights > 0 && (
              <div className="mt-5 rounded-lg border border-border bg-sand/40 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatCurrency(selectedRoom.pricePerNight)} × {nights}{" "}
                    {nights === 1 ? "night" : "nights"}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5 text-base font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-row flex-wrap gap-2 border-t border-border px-4 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating…" : "Create reservation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-700 dark:text-red-400">{error}</p>}
    </div>
  );
}

export default BookingsAdmin;
