"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { apiFetch, ApiError } from "@/lib/api-client";
import { AMENITY_CATEGORIES } from "@/lib/constants";
import type { Amenity, AmenityCategory } from "@/types";

const ICON_OPTIONS = [
  "Sparkles",
  "Waves",
  "TreePalm",
  "Utensils",
  "Wifi",
  "Wind",
  "Sun",
  "Snowflake",
  "Waves",
  "Bath",
  "Tv",
  "Coffee",
  "Wine",
  "Pool",
  "Dumbbell",
  "Car",
  "ParkingCircle",
  "ShowerHead",
  "AirVent",
  "Bone",
] as const;

export function AmenitiesAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-amenities"],
    queryFn: () => apiFetch<{ amenities: Amenity[] }>("/api/amenities"),
  });
  const amenities = data?.amenities ?? [];

  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Amenity | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/amenities?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-amenities"] });
      toast.success("Amenity removed.");
      setDeleting(null);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Couldn't remove amenity.";
      toast.error(message);
    },
  });

  return (
    <AdminLayout title="Amenities" subtitle="Manage what makes the villa special">
      <div className="space-y-6 pb-6">
        {AMENITY_CATEGORIES.map((cat) => {
          const items = amenities.filter((a) => a.category === cat.value);
          return (
            <section key={cat.value}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="eyebrow">{cat.value}</div>
                  <h2 className="mt-1 truncate font-display text-xl font-medium tracking-tight">
                    {cat.label}
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
                  onClick={() => setAddingCategory(cat.value)}
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Add amenity</span>
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No amenities here yet"
                  description={`Add the ${cat.label.toLowerCase()} the villa offers.`}
                  className="bg-card"
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((a) => (
                    <Card
                      key={a.id}
                      className="group flex items-start gap-3 rounded-xl border border-border p-4 shadow-card"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sand text-primary">
                        <Sparkles className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground">
                          {a.name}
                        </div>
                        {a.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {a.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground hover:bg-red-50 hover:text-red-700 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                        onClick={() => setDeleting(a)}
                        aria-label={`Remove ${a.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {addingCategory && (
        <AddAmenityDialog
          category={addingCategory as AmenityCategory}
          open={!!addingCategory}
          onClose={() => setAddingCategory(null)}
          onSaved={() => {
            setAddingCategory(null);
            qc.invalidateQueries({ queryKey: ["admin-amenities"] });
          }}
        />
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this amenity?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} will be removed from the villa and any rooms it
              was attached to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

function AddAmenityDialog({
  category,
  open,
  onClose,
  onSaved,
}: {
  category: AmenityCategory;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>("Sparkles");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ amenity: Amenity }>("/api/amenities", {
        method: "POST",
        body: JSON.stringify({
          name,
          icon,
          category,
          description: description || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success("Amenity added.");
      qc.invalidateQueries({ queryKey: ["admin-amenities"] });
      setName("");
      setIcon("Sparkles");
      setDescription("");
      onSaved();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Couldn't add amenity.";
      toast.error(message);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setName("");
          setIcon("Sparkles");
          setDescription("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-4 py-5 sm:px-6">
          <DialogTitle className="font-display text-xl font-medium tracking-tight">
            Add amenity
          </DialogTitle>
          <DialogDescription>
            For{" "}
            {AMENITY_CATEGORIES.find((c) => c.value === category)?.label}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name) return;
            mutation.mutate();
          }}
          className="flex max-h-[70vh] flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="space-y-1.5">
            <Label htmlFor="amenity-name" className="text-xs font-medium">
              Name
            </Label>
            <Input
              id="amenity-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Infinity pool, Beach access, WiFi"
              className="h-10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Icon</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amenity-desc" className="text-xs font-medium">
              Description (optional)
            </Label>
            <Textarea
              id="amenity-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="One short line for guests"
            />
          </div>
          </div>

          <DialogFooter className="flex-row gap-2 border-t border-border px-4 py-4 pt-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setName("");
                setIcon("Sparkles");
                setDescription("");
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full bg-primary text-white hover:bg-primary/90 sm:w-auto"
              disabled={mutation.isPending || !name}
            >
              {mutation.isPending ? "Adding…" : "Add amenity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AmenitiesAdmin;
