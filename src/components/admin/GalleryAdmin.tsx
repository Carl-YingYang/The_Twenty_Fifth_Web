"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Images, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { EmptyState } from "./StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { GALLERY_CATEGORIES } from "@/lib/constants";
import type { GalleryItem } from "@/types";

export function GalleryAdmin() {
  const qc = useQueryClient();
  const [category, setCategory] = useState<string>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<GalleryItem | null>(null);

  const qs = new URLSearchParams();
  if (category !== "ALL") qs.set("category", category);

  const { data, isLoading } = useQuery({
    queryKey: ["gallery", category],
    queryFn: () => apiFetch<{ gallery: GalleryItem[] }>(`/api/gallery?${qs.toString()}`),
  });

  const gallery = data?.gallery ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch("/api/gallery", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image added to gallery");
      setFormOpen(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to add image");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/gallery?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image removed");
      setDeleting(null);
    },
    onError: () => toast.error("Failed to remove image"),
  });

  return (
    <AdminLayout
      title="Gallery"
      subtitle="Curate the visual story of Verdara"
      actions={
        <Button size="sm" className="h-9 gap-1.5" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Add Image
        </Button>
      }
    >
      <Card className="rounded-2xl border-border/70 shadow-luxury">
        <CardContent className="p-3">
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-muted/60 p-1 sm:w-auto">
              {GALLERY_CATEGORIES.map((c) => (
                <TabsTrigger key={c} value={c} className="text-xs">
                  {c === "ALL" ? "All" : c.charAt(0) + c.slice(1).toLowerCase()}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
          ))}
        </div>
      ) : gallery.length === 0 ? (
        <Card className="mt-4 rounded-2xl border-border/70 shadow-luxury">
          <CardContent>
            <EmptyState
              icon={Images}
              title="No images yet"
              description="Add the first image to start building the gallery."
              action={
                <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
                  <Plus className="size-4" />
                  Add Image
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.2) }}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-luxury"
            >
              { }
              <img
                src={item.url}
                alt={item.title}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <div className="text-sm font-semibold text-white">{item.title}</div>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      "bg-white/20 text-white backdrop-blur"
                    )}
                  >
                    {item.category}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => setDeleting(item)}
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateImageDialog
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
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{deleting?.title}</span>{" "}
              will be permanently removed from the gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete image"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

function CreateImageDialog({
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
    title: "",
    category: "RESORT" as string,
    url: "",
    description: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title: form.title,
      category: form.category,
      url: form.url,
      description: form.description || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="border-b p-6">
          <DialogTitle className="text-base">Add gallery image</DialogTitle>
          <DialogDescription>
            Provide a title, category, and image URL.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Sunset Over Coral Bay"
            />
          </div>
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
                {GALLERY_CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.charAt(0) + c.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="url">Image URL *</Label>
            <Input
              id="url"
              type="url"
              required
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://images.example.com/scene.jpg"
            />
            {form.url && (
              <div className="mt-2 overflow-hidden rounded-lg border">
                { }
                <img
                  src={form.url}
                  alt="preview"
                  className="aspect-video w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional caption or description…"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              Add image
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default GalleryAdmin;
