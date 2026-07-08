"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { GALLERY_CATEGORIES } from "@/lib/constants";
import type { GalleryItem } from "@/types";

const CATEGORY_VALUES = GALLERY_CATEGORIES.filter((c) => c !== "ALL");

export function GalleryAdmin() {
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<GalleryItem | null>(null);

  const queryParams = new URLSearchParams();
  if (activeCategory !== "ALL") queryParams.set("category", activeCategory);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-gallery", activeCategory],
    queryFn: () =>
      apiFetch<{ gallery: GalleryItem[] }>(
        `/api/gallery?${queryParams.toString()}`
      ),
  });
  const gallery = data?.gallery ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/gallery?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Photo removed.");
      setDeleting(null);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Couldn't remove photo.";
      toast.error(message);
    },
  });

  return (
    <AdminLayout title="Photos" subtitle="Curate the villa's gallery">
      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        {GALLERY_CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "min-h-[36px] rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}
            >
              {cat === "ALL" ? "All photos" : prettify(cat)}
            </button>
          );
        })}
        <div className="ml-auto">
          <Button
            onClick={() => setAdding(true)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add Image</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : gallery.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title="No photos in this category"
          description="Add images to showcase the villa."
          action={
            <Button
              onClick={() => setAdding(true)}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Add Image
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.map((item) => (
            <Card
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border shadow-card"
            >
              <img
                src={item.url}
                alt={item.title}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-xs font-medium text-white">
                  {item.title}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-white/70">
                  {prettify(item.category)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 size-8 bg-white/90 text-foreground opacity-0 backdrop-blur-sm transition-opacity hover:bg-white hover:text-red-700 group-hover:opacity-100"
                onClick={() => setDeleting(item)}
                aria-label={`Remove ${item.title}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {adding && (
        <AddImageDialog
          open={adding}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            qc.invalidateQueries({ queryKey: ["admin-gallery"] });
            qc.invalidateQueries({ queryKey: ["gallery"] });
          }}
        />
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.title} will be removed from the gallery.
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

function AddImageDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("RESORT");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ item: GalleryItem }>("/api/gallery", {
        method: "POST",
        body: JSON.stringify({
          title,
          category,
          url,
          description: description || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success("Photo added.");
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      setTitle("");
      setCategory("RESORT");
      setUrl("");
      setDescription("");
      onSaved();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Couldn't add photo.";
      toast.error(message);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setTitle("");
          setCategory("RESORT");
          setUrl("");
          setDescription("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="font-display text-xl font-medium tracking-tight">
            Add photo
          </DialogTitle>
          <DialogDescription>
            Upload a new image to the gallery
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title || !url) return;
            mutation.mutate();
          }}
          className="space-y-4 px-6 py-5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="photo-title" className="text-xs font-medium">
              Title
            </Label>
            <Input
              id="photo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunset over the infinity pool"
              className="h-10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_VALUES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {prettify(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="photo-url" className="text-xs font-medium">
              Image URL
            </Label>
            <Input
              id="photo-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="h-10"
              required
            />
          </div>

          {url && (
            <div className="overflow-hidden rounded-lg border border-border">
              <img
                src={url}
                alt={title || "Preview"}
                className="aspect-video w-full object-cover"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="photo-desc" className="text-xs font-medium">
              Description (optional)
            </Label>
            <Textarea
              id="photo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTitle("");
                setCategory("RESORT");
                setUrl("");
                setDescription("");
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-white hover:bg-primary/90"
              disabled={mutation.isPending || !title || !url}
            >
              {mutation.isPending ? "Adding…" : "Add photo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function prettify(c: string): string {
  return c.charAt(0) + c.slice(1).toLowerCase();
}

export default GalleryAdmin;
