"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Eye,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { BookingStatusBadge } from "./StatusBadges";
import { EmptyState } from "./StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";

import { apiFetch, ApiError } from "@/lib/api-client";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  getInitials,
} from "@/lib/utils";
import type { Guest, Reservation } from "@/types";

interface GuestsResponse {
  guests: (Guest & {
    reservations?: {
      id: string;
      status: string;
      referenceNo: string;
      checkIn: string;
      checkOut: string;
    }[];
  })[];
}

interface GuestDetail extends Guest {
  reservations: (Reservation & { rooms?: { room?: { name: string; number: string } }[] })[];
}

export function GuestsAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Guest | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const qs = new URLSearchParams();
  if (debounced) qs.set("search", debounced);

  const { data, isLoading } = useQuery({
    queryKey: ["guests", debounced],
    queryFn: () => apiFetch<GuestsResponse>(`/api/guests?${qs.toString()}`),
  });

  const guests = data?.guests ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch(`/api/guests/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests"] });
      toast.success("Guest updated");
      setEditing(null);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to update guest");
    },
  });

  return (
    <AdminLayout title="Guests" subtitle="Manage guest profiles and history">
      <Card className="rounded-2xl border-border/70 shadow-luxury">
        <CardContent className="p-4">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 rounded-2xl border-border/70 shadow-luxury">
        <CardContent className="px-0 py-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : guests.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No guests found"
              description="Try a different search query."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">
                    Reservations
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                            {getInitials(`${g.firstName} ${g.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {g.firstName} {g.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground sm:hidden">
                            {g.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="flex items-center gap-1 text-foreground">
                          <Mail className="size-3 text-muted-foreground" />
                          {g.email}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="size-3" />
                          {g.phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {g.city || g.country ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {[g.city, g.country].filter(Boolean).join(", ")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      <Badge
                        variant="secondary"
                        className="h-6 min-w-8 tabular-nums"
                      >
                        {g.reservationCount ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatDateShort(g.createdAt)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setViewId(g.id)}
                          aria-label="View guest"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditing(g)}
                          aria-label="Edit guest"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View dialog */}
      <ViewDialog id={viewId} onClose={() => setViewId(null)} />

      {/* Edit dialog */}
      <EditDialog
        guest={editing}
        onClose={() => setEditing(null)}
        onSubmit={(payload) => {
          if (editing) updateMutation.mutate({ id: editing.id, payload });
        }}
        submitting={updateMutation.isPending}
      />
    </AdminLayout>
  );
}

function ViewDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["guest", id],
    queryFn: () =>
      id
        ? apiFetch<{ guest: GuestDetail }>(`/api/guests/${id}`)
        : Promise.reject(new Error("no id")),
    enabled: !!id,
  });

  const g = data?.guest;

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="border-b p-6">
          <DialogTitle className="text-base">Guest profile</DialogTitle>
          <DialogDescription className="sr-only">Guest details and history</DialogDescription>
        </DialogHeader>
        {isLoading || !g ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto p-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarFallback className="bg-emerald-50 text-base font-semibold text-emerald-700">
                  {getInitials(`${g.firstName} ${g.lastName}`)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-display text-lg font-semibold text-foreground">
                  {g.firstName} {g.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  Joined {formatDate(g.createdAt)}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoTile icon={Mail} label="Email" value={g.email} />
              <InfoTile icon={Phone} label="Phone" value={g.phone} />
              <InfoTile
                icon={MapPin}
                label="Location"
                value={
                  [g.city, g.country].filter(Boolean).join(", ") || "—"
                }
              />
              <InfoTile
                icon={CalendarDays}
                label="Reservations"
                value={`${g.reservations?.length ?? 0} total`}
              />
            </div>

            {g.address && (
              <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Address
                </div>
                <p className="mt-0.5 text-sm text-foreground">{g.address}</p>
              </div>
            )}

            {g.notes && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-amber-700">
                  Staff notes
                </div>
                <p className="mt-0.5 text-sm text-amber-900">{g.notes}</p>
              </div>
            )}

            <Separator className="my-5" />

            <div>
              <div className="mb-3 text-sm font-semibold text-foreground">
                Reservation history
              </div>
              {g.reservations && g.reservations.length > 0 ? (
                <div className="space-y-2">
                  {g.reservations.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium text-emerald-700">
                            {r.referenceNo}
                          </span>
                          <BookingStatusBadge status={r.status} />
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateShort(r.checkIn)} →{" "}
                          {formatDateShort(r.checkOut)}
                          {r.rooms?.[0]?.room && (
                            <>
                              {" · "}
                              {r.rooms[0].room.name} #{r.rooms[0].room.number}
                            </>
                          )}
                        </div>
                      </div>
                      {"totalAmount" in r && typeof r.totalAmount === "number" && (
                        <div className="text-right">
                          <div className="text-sm font-semibold text-foreground">
                            {formatCurrency(r.totalAmount as number)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                  No reservations yet
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  guest,
  onClose,
  onSubmit,
  submitting,
}: {
  guest: Guest | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    notes: "",
  });

  useEffect(() => {
    if (guest) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone,
        address: guest.address ?? "",
        city: guest.city ?? "",
        country: guest.country ?? "",
        notes: guest.notes ?? "",
      });
    }
  }, [guest]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <Dialog
      open={!!guest}
      onOpenChange={(o) => !o && onClose()}
    >
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto p-0">
        <DialogHeader className="border-b p-6">
          <DialogTitle className="text-base">Edit guest profile</DialogTitle>
          <DialogDescription>
            Update contact information or add internal staff notes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name *</Label>
              <Input
                id="firstName"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name *</Label>
              <Input
                id="lastName"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Staff notes</Label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="Internal notes — preferences, VIP status, special requirements…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export default GuestsAdmin;
