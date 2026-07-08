"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BedDouble,
  ImageOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { RoomStatusBadge } from "./StatusBadges";
import { EmptyState } from "./StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { apiFetch, ApiError } from "@/lib/api-client";
import { cn, formatCurrency } from "@/lib/utils";
import { ROOM_STATUS_CONFIG } from "@/lib/constants";
import type { Amenity, Room, RoomStatus, RoomType } from "@/types";

interface RoomsResponse {
  rooms: Room[];
}
interface RoomTypesResponse {
  roomTypes: RoomType[];
}
interface AmenitiesResponse {
  amenities: (Amenity & { roomCount?: number })[];
}

const ROOM_STATUSES: RoomStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "OCCUPIED",
  "CLEANING",
  "MAINTENANCE",
  "BLOCKED",
];

interface RoomFormState {
  number: string;
  name: string;
  description: string;
  floor: string;
  view: string;
  pricePerNight: string;
  capacity: string;
  typeId: string;
  status: RoomStatus;
  imageUrls: string[];
  amenityIds: string[];
}

const EMPTY_FORM: RoomFormState = {
  number: "",
  name: "",
  description: "",
  floor: "",
  view: "",
  pricePerNight: "",
  capacity: "2",
  typeId: "",
  status: "AVAILABLE",
  imageUrls: ["", "", ""],
  amenityIds: [],
};

export function RoomsAdmin() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomFormState>(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiFetch<RoomsResponse>("/api/rooms"),
  });

  const { data: typesData } = useQuery({
    queryKey: ["room-types"],
    queryFn: () => apiFetch<RoomTypesResponse>("/api/rooms/types"),
  });

  const { data: amenitiesData } = useQuery({
    queryKey: ["amenities"],
    queryFn: () => apiFetch<AmenitiesResponse>("/api/amenities"),
  });

  const rooms = data?.rooms ?? [];
  const roomTypes = typesData?.roomTypes ?? [];
  const amenities = amenitiesData?.amenities ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch("/api/rooms/types", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room created");
      setFormOpen(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to create room");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiFetch(`/api/rooms/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room updated");
      setFormOpen(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to update room");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/rooms/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room removed");
      setDeleting(null);
    },
    onError: () => toast.error("Failed to remove room"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoomStatus }) =>
      apiFetch(`/api/rooms/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      typeId: roomTypes[0]?.id ?? "",
    });
    setFormOpen(true);
  }

  function openEdit(room: Room) {
    setEditing(room);
    setForm({
      number: room.number,
      name: room.name,
      description: room.description,
      floor: room.floor?.toString() ?? "",
      view: room.view ?? "",
      pricePerNight: room.pricePerNight.toString(),
      capacity: room.capacity.toString(),
      typeId: room.typeId,
      status: (room.status as RoomStatus) ?? "AVAILABLE",
      imageUrls: [
        room.images?.[0]?.url ?? "",
        room.images?.[1]?.url ?? "",
        room.images?.[2]?.url ?? "",
      ],
      amenityIds: room.amenities?.map((a) => a.id) ?? [],
    });
    setFormOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.typeId) {
      toast.error("Please select a room type");
      return;
    }
    const payload = {
      number: form.number,
      name: form.name,
      description: form.description,
      floor: form.floor ? parseInt(form.floor, 10) : null,
      view: form.view || null,
      pricePerNight: parseFloat(form.pricePerNight) || 0,
      capacity: parseInt(form.capacity, 10) || 1,
      typeId: form.typeId,
      status: form.status,
      imageUrls: form.imageUrls
        .filter((u) => u.trim())
        .map((url, i) => ({ url, isPrimary: i === 0 })),
      amenityIds: form.amenityIds,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function toggleAmenity(id: string) {
    setForm((f) => ({
      ...f,
      amenityIds: f.amenityIds.includes(id)
        ? f.amenityIds.filter((a) => a !== id)
        : [...f.amenityIds, id],
    }));
  }

  return (
    <AdminLayout
      title="Rooms"
      subtitle="Manage room inventory"
      actions={
        <Button size="sm" className="h-9 gap-1.5" onClick={openCreate}>
          <Plus className="size-4" />
          Add Room
        </Button>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <Card className="rounded-2xl border-border/70 shadow-luxury">
          <CardContent>
            <EmptyState
              icon={BedDouble}
              title="No rooms yet"
              description="Create your first room to start taking reservations."
              action={
                <Button size="sm" onClick={openCreate} className="gap-1.5">
                  <Plus className="size-4" />
                  Add Room
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.2) }}
            >
              <Card className="group gap-0 overflow-hidden rounded-2xl border-border/70 shadow-luxury">
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {room.images?.[0]?.url ? (
                     
                    <img
                      src={room.images[0].url}
                      alt={room.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-8" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white/95 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur">
                      {room.number}
                    </span>
                  </div>
                  <div className="absolute right-3 top-3">
                    <RoomStatusBadge status={room.status} />
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-semibold text-foreground">
                        {room.name}
                      </h3>
                      <Badge variant="secondary" className="mt-1 h-5 text-[10px] font-medium">
                        {room.type?.name ?? "Room"}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 shrink-0">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEdit(room)}>
                          <Pencil className="size-4" />
                          Edit room
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs">
                          Change status
                        </DropdownMenuLabel>
                        {ROOM_STATUSES.map((s) => (
                          <DropdownMenuItem
                            key={s}
                            onClick={() =>
                              statusMutation.mutate({ id: room.id, status: s })
                            }
                            disabled={room.status === s}
                          >
                            <span
                              className={cn(
                                "size-2 rounded-full",
                                ROOM_STATUS_CONFIG[s]?.dot
                              )}
                            />
                            {ROOM_STATUS_CONFIG[s]?.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(room)}
                        >
                          <Trash2 className="size-4" />
                          Delete room
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UsersIcon className="size-3.5" />
                        {room.capacity}
                      </span>
                      {room.floor !== null && (
                        <span>Fl. {room.floor}</span>
                      )}
                      {room.view && (
                        <span className="truncate">{room.view}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-display text-base font-semibold text-foreground">
                        {formatCurrency(room.pricePerNight)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">per night</div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
          <DialogHeader className="border-b p-6">
            <DialogTitle>
              {editing ? `Edit room · ${editing.number}` : "Add a new room"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update room details, images, and amenities."
                : "Fill out the form below to add a new room to the inventory."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="number">Room number *</Label>
                <Input
                  id="number"
                  required
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="e.g. 101"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Room name *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Oceanview Suite"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">Room type *</Label>
                <Select
                  value={form.typeId}
                  onValueChange={(v) => setForm({ ...form, typeId: v })}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} · {formatCurrency(t.basePrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as RoomStatus })}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ROOM_STATUS_CONFIG[s]?.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price / night (PHP) *</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  required
                  value={form.pricePerNight}
                  onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  required
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  min={0}
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="view">View</Label>
              <Input
                id="view"
                value={form.view}
                onChange={(e) => setForm({ ...form, view: e.target.value })}
                placeholder="e.g. Ocean, Garden, Pool"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the room, its features, and what makes it special."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Image URLs (up to 3)</Label>
              <div className="space-y-2">
                {form.imageUrls.map((url, i) => (
                  <Input
                    key={i}
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const next = [...form.imageUrls];
                      next[i] = e.target.value;
                      setForm({ ...form, imageUrls: next });
                    }}
                    placeholder={`https://images.example.com/room-${i + 1}.jpg`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Amenities</Label>
              {amenities.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No amenities available. Create some first.
                </p>
              ) : (
                <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-3">
                  {amenities.map((a) => (
                    <label
                      key={a.id}
                      className="flex cursor-pointer items-start gap-2 text-xs"
                    >
                      <Checkbox
                        checked={form.amenityIds.includes(a.id)}
                        onCheckedChange={() => toggleAmenity(a.id)}
                      />
                      <span className="leading-tight text-foreground">{a.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editing ? "Save changes" : "Create room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete room?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently deactivate room{" "}
              <span className="font-medium text-foreground">
                {deleting?.name} ({deleting?.number})
              </span>
              . The room will no longer appear in availability results. This action
              can be reversed in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete room"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

export default RoomsAdmin;
