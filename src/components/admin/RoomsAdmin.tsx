"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BedDouble,
  Home,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { RoomStatusBadge } from "./StatusBadges";
import { EmptyState } from "./StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { apiFetch, ApiError } from "@/lib/api-client";
import { cn, formatCurrency } from "@/lib/utils";
import { ROOM_STATUS_CONFIG } from "@/lib/constants";
import type { Room, RoomStatus, RoomType } from "@/types";

const ROOM_STATUS_VALUES: RoomStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "OCCUPIED",
  "CLEANING",
  "MAINTENANCE",
  "BLOCKED",
];

const ROOMS_PAGE_SIZE = 6;

export function RoomsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: () => apiFetch<{ rooms: Room[] }>("/api/rooms"),
  });
  const rooms = (data?.rooms ?? []).filter((r) => r.isActive);

  const [editing, setEditing] = useState<Room | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [page, setPage] = useState(1);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(rooms.length / ROOMS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * ROOMS_PAGE_SIZE;
  const endIdx = Math.min(startIdx + ROOMS_PAGE_SIZE, rooms.length);
  const pagedRooms = rooms.slice(startIdx, endIdx);

  const goToPage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoomStatus }) =>
      apiFetch<{ room: Room }>(`/api/rooms/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-rooms"] });
      qc.invalidateQueries({ queryKey: ["admin-calendar"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(`${data.room.name} marked as ${ROOM_STATUS_CONFIG[data.room.status].label}.`);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Couldn't update room.";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/rooms/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-rooms"] });
      toast.success("Room removed.");
      setDeleting(null);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Couldn't remove room.";
      toast.error(message);
    },
  });

  return (
    <AdminLayout title="The Villa" subtitle="Manage rooms, photos, and availability">
      <div className="mb-5 flex items-center justify-between gap-3 pb-6">
        <div className="min-w-0">
          <div className="eyebrow">{rooms.length} spaces</div>
          <h2 className="mt-1 truncate font-display text-2xl font-medium tracking-tight">
            The Villa at {`The Twenty-Fifth`}
          </h2>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add Room</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-lg" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No rooms yet"
          description="Add your first room to start taking reservations."
          action={
            <Button
              onClick={() => setCreating(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Add Room
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-6">
            {pagedRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onEdit={() => setEditing(room)}
                onDelete={() => setDeleting(room)}
                onStatusChange={(s) =>
                  statusMutation.mutate({ id: room.id, status: s })
                }
                pending={statusMutation.isPending}
              />
            ))}
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-3 border-t border-border pt-4 sm:flex-row sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {startIdx + 1}–{endIdx} of {rooms.length} rooms
              </p>
              <Pagination className="sm:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <button
                      type="button"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      aria-label="First page"
                    >
                      <ChevronsLeft className="size-4" />
                    </button>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => goToPage(currentPage - 1)}
                      aria-disabled={currentPage === 1}
                      className={currentPage === 1 ? "pointer-events-none opacity-40" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const p = i + 1;
                    // Show first, last, current, and neighbors; ellipsis for gaps
                    if (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1
                    ) {
                      return (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === currentPage}
                            onClick={() => goToPage(p)}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    if (p === currentPage - 2 || p === currentPage + 2) {
                      return (
                        <PaginationItem key={p} className="text-muted-foreground">
                          <span className="px-1">…</span>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => goToPage(currentPage + 1)}
                      aria-disabled={currentPage === totalPages}
                      className={currentPage === totalPages ? "pointer-events-none opacity-40" : ""}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <button
                      type="button"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      aria-label="Last page"
                    >
                      <ChevronsRight className="size-4" />
                    </button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Edit dialog */}
      {editing && (
        <RoomFormDialog
          room={editing}
          open={!!editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["admin-rooms"] });
          }}
        />
      )}

      {/* Create dialog */}
      <RoomFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => {
          setCreating(false);
          qc.invalidateQueries({ queryKey: ["admin-rooms"] });
        }}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this room?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} will be hidden from the website and calendar.
              Existing reservations are kept. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing…" : "Remove room"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

function RoomCard({
  room,
  onEdit,
  onDelete,
  onStatusChange,
  pending,
}: {
  room: Room;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: RoomStatus) => void;
  pending: boolean;
}) {
  const image = room.images?.[0]?.url;
  const cfg = ROOM_STATUS_CONFIG[room.status as string] ?? ROOM_STATUS_CONFIG.AVAILABLE;

  return (
    <Card className="overflow-hidden rounded-lg border border-border shadow-card">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={room.images?.[0]?.altText ?? room.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-sand text-muted-foreground">
            <BedDouble className="size-8" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <RoomStatusBadge status={room.status as string} />
        </div>
        <div className="absolute right-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
          {formatCurrency(room.pricePerNight)}
          <span className="text-muted-foreground">/night</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display text-base font-medium tracking-tight text-foreground sm:text-lg">
              {room.name}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              {room.type?.name ?? "Room"} · {room.number}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground sm:text-sm">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            Sleeps {room.capacity}
          </span>
          {room.view && (
            <span className="flex items-center gap-1">
              <Home className="size-3.5" />
              {room.view}
            </span>
          )}
        </div>

        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-relaxed">
          {room.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 flex-1 min-w-[100px] text-sm"
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 min-w-[44px] gap-1.5"
                disabled={pending}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="hidden sm:inline">{cfg.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ROOM_STATUS_VALUES.map((s) => {
                const c = ROOM_STATUS_CONFIG[s];
                return (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => onStatusChange(s)}
                    className="gap-2"
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.label}
                    <span className="text-xs text-muted-foreground">
                      — {c.friendly}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 text-muted-foreground hover:bg-red-50 hover:text-red-700"
            onClick={onDelete}
            aria-label="Remove room"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface RoomFormValues {
  number: string;
  name: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  status: RoomStatus;
  typeId: string;
  view: string;
  imageUrls: { url: string; altText: string }[];
}

function RoomFormDialog({
  room,
  open,
  onClose,
  onSaved,
}: {
  room?: Room | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const { data: typesData } = useQuery({
    queryKey: ["admin-room-types"],
    queryFn: () => apiFetch<{ roomTypes: (RoomType & { rooms: { id: string }[] })[] }>("/api/rooms/types"),
    enabled: open,
  });
  const types = typesData?.roomTypes ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RoomFormValues>({
    defaultValues: {
      number: room?.number ?? "",
      name: room?.name ?? "",
      description: room?.description ?? "",
      pricePerNight: room?.pricePerNight ?? 0,
      capacity: room?.capacity ?? 2,
      status: (room?.status as RoomStatus) ?? "AVAILABLE",
      typeId: room?.typeId ?? "",
      view: room?.view ?? "",
      imageUrls:
        room?.images?.map((i) => ({ url: i.url, altText: i.altText ?? "" })) ??
        [],
    },
  });

  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");

  const imageUrls = watch("imageUrls");
  const status = watch("status");
  const typeId = watch("typeId");

  function addImage() {
    if (!newImageUrl) return;
    setValue("imageUrls", [
      ...imageUrls,
      { url: newImageUrl, altText: newImageAlt },
    ]);
    setNewImageUrl("");
    setNewImageAlt("");
  }

  function removeImage(idx: number) {
    setValue(
      "imageUrls",
      imageUrls.filter((_, i) => i !== idx)
    );
  }

  const mutation = useMutation({
    mutationFn: (values: RoomFormValues) => {
      const payload = {
        ...values,
        floor: null,
        imageUrls: values.imageUrls.map((i, idx) => ({
          url: i.url,
          altText: i.altText || null,
          isPrimary: idx === 0,
        })),
      };
      if (room) {
        return apiFetch<{ room: Room }>(`/api/rooms/${room.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      return apiFetch<{ room: Room }>("/api/rooms", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(room ? "Room updated." : "Room added.");
      qc.invalidateQueries({ queryKey: ["admin-rooms"] });
      reset();
      onSaved();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Couldn't save room.";
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
            {room ? "Edit room" : "Add room"}
          </DialogTitle>
          <DialogDescription>
            {room
              ? `Update ${room.name}`
              : "Add a new space to the villa."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex max-h-[70vh] flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Room name" error={errors.name?.message}>
                <Input {...register("name", { required: true })} className="h-10" />
              </Field>
              <Field label="Room number / label" error={errors.number?.message}>
                <Input {...register("number", { required: true })} className="h-10" />
              </Field>
            </div>

            <Field label="Description" error={errors.description?.message}>
              <Textarea
                {...register("description", { required: true })}
                rows={3}
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field
                label="Price per night (₱)"
                error={errors.pricePerNight?.message}
              >
                <Input
                  type="number"
                  min={0}
                  {...register("pricePerNight", { valueAsNumber: true, required: true })}
                  className="h-10"
                />
              </Field>
              <Field label="Capacity" error={errors.capacity?.message}>
                <Input
                  type="number"
                  min={1}
                  {...register("capacity", { valueAsNumber: true, required: true })}
                  className="h-10"
                />
              </Field>
              <Field label="View" error={errors.view?.message}>
                <Input {...register("view")} className="h-10" />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Room type" error={errors.typeId?.message}>
                <Select
                  value={typeId}
                  onValueChange={(v) => setValue("typeId", v)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status" error={errors.status?.message}>
                <Select
                  value={status}
                  onValueChange={(v) => setValue("status", v as RoomStatus)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_STATUS_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ROOM_STATUS_CONFIG[s].label} — {ROOM_STATUS_CONFIG[s].friendly}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Images */}
            <div>
              <Label className="text-xs font-medium text-foreground">
                Images
              </Label>
              <div className="mt-2 space-y-2">
                {imageUrls.length > 0 && (
                  <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                    {imageUrls.map((img, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
                      >
                        <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          <img
                            src={img.url}
                            alt={img.altText || `Room image ${idx + 1}`}
                            className="size-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs text-foreground" title={img.url}>
                            {img.url}
                          </div>
                          <div className="truncate text-xs text-muted-foreground" title={img.altText}>
                            {img.altText || "No alt text"}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 hover:bg-red-50 hover:text-red-700"
                          onClick={() => removeImage(idx)}
                          aria-label="Remove image"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="https://image-url.jpg"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="h-9"
                  />
                  <Input
                    placeholder="Alt text (describe the image)"
                    value={newImageAlt}
                    onChange={(e) => setNewImageAlt(e.target.value)}
                    className="h-9 sm:w-48"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={addImage}
                    disabled={!newImageUrl}
                  >
                    <ImagePlus className="size-3.5" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border px-4 py-4 sm:px-6">
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
              {mutation.isPending
                ? "Saving…"
                : room
                ? "Save changes"
                : "Add room"}
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
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}

export default RoomsAdmin;
