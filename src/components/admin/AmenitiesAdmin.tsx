"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { EmptyState } from "./StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { AMENITY_CATEGORIES } from "@/lib/constants";
import type { Amenity } from "@/types";

type AmenityWithCount = Amenity & { roomCount?: number };

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  AMENITY_CATEGORIES.map((c) => [c.value, c.label])
);

const CATEGORY_COLORS: Record<string, string> = {
  RESORT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ROOM: "bg-sky-50 text-sky-700 border-sky-200",
  DINING: "bg-amber-50 text-amber-700 border-amber-200",
  WELLNESS: "bg-violet-50 text-violet-700 border-violet-200",
  GENERAL: "bg-slate-50 text-slate-700 border-slate-200",
};

const ICON_SUGGESTIONS = [
  "Wifi",
  "Waves",
  "Wine",
  "Coffee",
  "UtensilsCrossed",
  "Dumbbell",
  "Spa",
  "Trees",
  "Waves",
  "Sun",
  "Car",
  "Plane",
  "ShowerHead",
  "Tv",
  "AirVent",
  "Snowflake",
  "Baby",
  "Dog",
];

export function AmenitiesAdmin() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Amenity | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["amenities"],
    queryFn: () => apiFetch<{ amenities: AmenityWithCount[] }>("/api/amenities"),
  });

  const amenities = data?.amenities ?? [];

  // Group by category
  const grouped = amenities.reduce<Record<string, AmenityWithCount[]>>(
    (acc, a) => {
      const cat = String(a.category ?? "GENERAL");
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    },
    {}
  );

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch("/api/amenities", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["amenities"] });
      toast.success("Amenity created");
      setFormOpen(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to create amenity");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/amenities?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["amenities"] });
      toast.success("Amenity removed");
      setDeleting(null);
    },
    onError: () => toast.error("Failed to remove amenity"),
  });

  return (
    <AdminLayout
      title="Amenities"
      subtitle="Manage resort, room, and wellness amenities"
      actions={
        <Button size="sm" className="h-9 gap-1.5" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Add Amenity
        </Button>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : amenities.length === 0 ? (
        <Card className="rounded-2xl border-border/70 shadow-luxury">
          <CardContent>
            <EmptyState
              icon={Sparkles}
              title="No amenities yet"
              description="Add amenities to assign them to rooms."
              action={
                <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
                  <Plus className="size-4" />
                  Add Amenity
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {AMENITY_CATEGORIES.map((cat) => {
            const items = grouped[cat.value] ?? [];
            if (items.length === 0) return null;
            return (
              <CategoryCard
                key={cat.value}
                category={cat.value}
                label={cat.label}
                amenities={items}
                onDelete={(a) => setDeleting(a)}
              />
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <CreateAmenityDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
        submitting={createMutation.isPending}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete amenity?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{deleting?.name}</span>{" "}
              will be removed from all rooms. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

function CategoryCard({
  category,
  label,
  amenities,
  onDelete,
}: {
  category: string;
  label: string;
  amenities: AmenityWithCount[];
  onDelete: (a: Amenity) => void;
}) {
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.GENERAL;
  return (
    <Card className="rounded-2xl border-border/70 shadow-luxury">
      <CardHeader className="flex-row items-center justify-between border-b py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Badge
            variant="outline"
            className={cn("h-6 gap-1 px-2 text-xs", colors)}
          >
            {label}
          </Badge>
          <span className="text-xs font-normal text-muted-foreground">
            {amenities.length} {amenities.length === 1 ? "item" : "items"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-2 py-4">
        <ul className="space-y-1">
          {amenities.map((a) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                  colors
                )}
              >
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {a.name}
                </div>
                {a.description && (
                  <div className="truncate text-xs text-muted-foreground">
                    {a.description}
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px]">
                {a.roomCount ?? 0} rooms
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                onClick={() => onDelete(a)}
                aria-label={`Delete ${a.name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CreateAmenityDialog({
  open,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    category: "RESORT" as string,
    icon: "Sparkles",
    description: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: form.name,
      category: form.category,
      icon: form.icon,
      description: form.description || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="border-b p-6">
          <DialogTitle className="text-base">Add amenity</DialogTitle>
          <DialogDescription>
            Create a new amenity that can be assigned to rooms.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ocean View, Spa Access, Free Wi-Fi"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AMENITY_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="icon">Icon name</Label>
              <Select
                value={form.icon}
                onValueChange={(v) => setForm({ ...form, icon: v })}
              >
                <SelectTrigger id="icon" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_SUGGESTIONS.map((ic) => (
                    <SelectItem key={ic} value={ic}>
                      {ic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description of the amenity…"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              Create amenity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AmenitiesAdmin;
