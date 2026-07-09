"use client";

import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { ConfirmDialog } from "./ConfirmDialog";
import { BookingStatusBadge } from "./StatusBadges";
import { EmptyState } from "./StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { apiFetch } from "@/lib/api-client";
import { cn, formatDate, formatDateShort, getInitials } from "@/lib/utils";
import { useBookingStore } from "@/store/useBookingStore";
import { useViewStore } from "@/store/useViewStore";
import type { Guest } from "@/types";

interface GuestWithReservations extends Guest {
  reservations?: Array<{
    id: string;
    status: string;
    referenceNo: string;
    checkIn: string;
    checkOut: string;
  }>;
}

/** Number of guests rendered per page (client-side pagination). */
const PAGE_SIZE = 10;

type PageItem =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string };

/**
 * Build the list of page items to render in the pagination bar.
 * Always shows the first and last page, the current page ± 1, and
 * ellipses where ranges are skipped. When there are 7 or fewer pages
 * we just render every page number.
 */
function getPageRange(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => ({
      type: "page" as const,
      page: i + 1,
    }));
  }

  const items: PageItem[] = [{ type: "page", page: 1 }];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) items.push({ type: "ellipsis", key: "start" });
  for (let i = left; i <= right; i++) {
    items.push({ type: "page", page: i });
  }
  if (right < total - 1) items.push({ type: "ellipsis", key: "end" });
  items.push({ type: "page", page: total });

  return items;
}

/** A keyboard-accessible pagination link backed by `PaginationLink`. */
function PageNavButton({
  onClick,
  disabled,
  isActive,
  ariaLabel,
  children,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <PaginationLink
      isActive={isActive}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={disabled || isActive || undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "cursor-pointer select-none",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
    </PaginationLink>
  );
}

export function GuestsAdmin() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to the first page whenever the (debounced) search query changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- paginating client-side; a new search must start from page 1
    setPage(1);
  }, [debouncedSearch]);

  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.set("search", debouncedSearch);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-guests", debouncedSearch],
    queryFn: () =>
      apiFetch<{ guests: GuestWithReservations[] }>(
        `/api/guests?${queryParams.toString()}`
      ),
  });

  const guests = data?.guests ?? [];
  const selected = guests.find((g) => g.id === selectedGuestId) ?? null;

  // --- Client-side pagination ----------------------------------------------
  const totalGuests = guests.length;
  const totalPages = Math.max(1, Math.ceil(totalGuests / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, totalGuests);
  const pagedGuests = guests.slice(startIdx, endIdx);
  const pageRange = getPageRange(currentPage, totalPages);

  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const showPaginationFooter = !isLoading && totalGuests > 0;

  return (
    <AdminLayout title="Guests" subtitle="Search guests and view their stay history">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or phone"
            className="h-10 pl-9"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {totalGuests} {totalGuests === 1 ? "guest" : "guests"}
        </div>
      </div>

      {/* Desktop / tablet table */}
      <Card className="hidden overflow-hidden rounded-lg border border-border shadow-card md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Guest
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Location
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Stays
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Last stay
                </TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : pagedGuests.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-12">
                  <EmptyState
                    icon={Users}
                    title="No guests found"
                    description="Try a different search."
                  />
                </TableCell>
              </TableRow>
            ) : (
              pagedGuests.map((g) => {
                const lastStay = g.reservations?.[0];
                return (
                  <TableRow
                    key={g.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedGuestId(g.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8 border border-border">
                          <AvatarFallback className="bg-sand text-[10px] font-semibold text-primary">
                            {getInitials(`${g.firstName} ${g.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">
                            {g.firstName} {g.lastName}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            Guest since {formatDateShort(g.createdAt)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      <div className="flex flex-col">
                        <span className="truncate">{g.email}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {g.phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {g.city || g.country
                        ? [g.city, g.country].filter(Boolean).join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {g.reservationCount ?? 0}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lastStay ? formatDateShort(lastStay.checkIn) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden pb-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))
        ) : pagedGuests.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No guests found"
            description="Try a different search."
          />
        ) : (
          pagedGuests.map((g) => (
            <Card
              key={g.id}
              className="cursor-pointer rounded-lg border border-border p-4 shadow-card"
              onClick={() => setSelectedGuestId(g.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-10 border border-border">
                  <AvatarFallback className="bg-sand text-xs font-semibold text-primary">
                    {getInitials(`${g.firstName} ${g.lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {g.firstName} {g.lastName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {g.email}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {g.reservationCount ?? 0}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    stays
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-border pt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="size-3" />
                  {g.phone}
                </span>
                {(g.city || g.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {[g.city, g.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination footer (shared by desktop table + mobile cards) */}
      {showPaginationFooter && (
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {startIdx + 1}–{endIdx} of {totalGuests} guests
          </p>
          {totalPages > 1 && (
            <Pagination className="mx-0 w-full justify-center sm:w-auto sm:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PageNavButton
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    ariaLabel="Go to first page"
                  >
                    <ChevronsLeft className="size-4" />
                    <span className="hidden sm:block">First</span>
                  </PageNavButton>
                </PaginationItem>
                <PaginationItem>
                  <PaginationPrevious
                    role="button"
                    tabIndex={currentPage === 1 ? -1 : 0}
                    aria-disabled={currentPage === 1 || undefined}
                    aria-label="Go to previous page"
                    onClick={
                      currentPage === 1
                        ? undefined
                        : () => goToPage(currentPage - 1)
                    }
                    className={cn(
                      "cursor-pointer select-none",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                {pageRange.map((item) =>
                  item.type === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${item.key}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item.page}>
                      <PageNavButton
                        onClick={() => goToPage(item.page)}
                        isActive={item.page === currentPage}
                        disabled={item.page === currentPage}
                        ariaLabel={`Go to page ${item.page}`}
                      >
                        {item.page}
                      </PageNavButton>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    role="button"
                    tabIndex={currentPage === totalPages ? -1 : 0}
                    aria-disabled={currentPage === totalPages || undefined}
                    aria-label="Go to next page"
                    onClick={
                      currentPage === totalPages
                        ? undefined
                        : () => goToPage(currentPage + 1)
                    }
                    className={cn(
                      "cursor-pointer select-none",
                      currentPage === totalPages &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PageNavButton
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    ariaLabel="Go to last page"
                  >
                    <span className="hidden sm:block">Last</span>
                    <ChevronsRight className="size-4" />
                  </PageNavButton>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* Details dialog */}
      {selected && (
        <GuestDetailsDialog
          guest={selected}
          open={!!selected}
          onClose={() => setSelectedGuestId(null)}
        />
      )}
    </AdminLayout>
  );
}

function GuestDetailsDialog({
  guest,
  open,
  onClose,
}: {
  guest: GuestWithReservations;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useViewStore((s) => s.navigate);
  const { selectRoom } = useBookingStore();
  const [confirmBooking, setConfirmBooking] = useState(false);

  const reservations = guest.reservations ?? [];

  const startBookingForGuest = () => {
    const name = `${guest.firstName} ${guest.lastName}`.trim();
    selectRoom("");
    navigate("book");
    toast.success(`Starting a new booking for ${name}.`);
    setConfirmBooking(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b border-border px-4 py-5 sm:px-6">
          <DialogTitle className="font-display text-xl font-medium tracking-tight">
            Guest profile
          </DialogTitle>
          <DialogDescription>
            Stays and contact details
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[85vh] overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mb-5 flex items-center gap-3">
            <Avatar className="size-12 shrink-0 border border-border">
              <AvatarFallback className="bg-sand text-sm font-semibold text-primary">
                {getInitials(`${guest.firstName} ${guest.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-base font-medium text-foreground">
                {guest.firstName} {guest.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                Guest since {formatDate(guest.createdAt)}
              </div>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow icon={Mail} label="Email" value={guest.email} />
            <InfoRow icon={Phone} label="Phone" value={guest.phone} />
            <InfoRow
              icon={MapPin}
              label="Location"
              value={
                guest.city || guest.country
                  ? [guest.city, guest.country].filter(Boolean).join(", ")
                  : "—"
              }
            />
            <InfoRow
              icon={CalendarDays}
              label="Total stays"
              value={String(guest.reservationCount ?? 0)}
            />
          </div>

          {guest.notes && (
            <div className="mb-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes
              </h4>
              <p className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
                {guest.notes}
              </p>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reservation history
            </h4>
            {reservations.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No reservations yet.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {reservations.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {r.referenceNo}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateShort(r.checkIn)} →{" "}
                        {formatDateShort(r.checkOut)}
                      </div>
                    </div>
                    <BookingStatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row flex-wrap gap-2 border-t border-border px-4 py-4 sm:px-6">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              selectRoom("");
              navigate("book");
            }}
          >
            <Plus className="size-4" />
            New booking for this guest
          </Button>
          <Button
            variant="ghost"
            className="ml-auto w-full sm:w-auto"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={confirmBooking}
      onOpenChange={setConfirmBooking}
      tone="info"
      title={`Start a new booking for ${guest.firstName} ${guest.lastName}?`}
      description="You'll leave the admin panel and open the booking flow. The guest's details will be referenced for this reservation."
      confirmLabel="Start booking"
      loading={false}
      onConfirm={startBookingForGuest}
    />
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

export default GuestsAdmin;
