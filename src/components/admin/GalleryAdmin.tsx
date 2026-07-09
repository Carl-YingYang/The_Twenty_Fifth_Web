"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState } from "./StatCard";
import { ImageUploader } from "./ImageUploader";
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

import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { GALLERY_CATEGORIES } from "@/lib/constants";
import type { GalleryItem } from "@/types";

const CATEGORY_VALUES = GALLERY_CATEGORIES.filter((c) => c !== "ALL");
const PAGE_SIZE = 12;

export function GalleryAdmin() {
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<GalleryItem | null>(null);
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  if (activeCategory !== "ALL") queryParams.set("category", activeCategory);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-gallery", activeCategory],
    queryFn: () =>
      apiFetch<{ gallery: GalleryItem[]}>(
        `/api/gallery?${queryParams.toString()}`
      ),
  });
  const gallery = data?.gallery ?? [];

  // Reset to page 1 when category changes
  const totalPages = Math.max(1, Math.ceil(gallery.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = gallery.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    setPage(1);
  }

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
              onClick={() => handleCategoryChange(cat)}
              className={cn(
                "min-h-[36px] rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}
            >
              {cat === "ALL" ? "All photos" : prettify(cat)}
            </button>
          );
        })}
      </div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {gallery.length} photo{gallery.length === 1 ? "" : "s"}
          {totalPages > 1 && ` · page ${currentPage} of ${totalPages}`}
        </p>
        <Button
          onClick={() => setAdding(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add Image</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
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
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Add Image
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-3 lg:grid-cols-4">
            {paginatedItems.map((item) => (
              <Card
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border shadow-card"
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-90" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="truncate text-xs font-medium text-white">
                    {item.title}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/70">
                    {prettify(item.category)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 size-8 bg-white/90 text-foreground backdrop-blur-sm transition-opacity hover:bg-white hover:text-red-700 sm:opacity-0 sm:group-hover:opacity-100"
                  onClick={() => setDeleting(item)}
                  aria-label={`Remove ${item.title}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNum);
                        }}
                        isActive={pageNum === currentPage}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
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

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        tone="destructive"
        title="Remove this photo?"
        description={`${deleting?.title ?? "This photo"} will be removed from the gallery and no longer appear on the website.`}
        confirmLabel="Remove photo"
        hint="This cannot be undone."
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
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

  function reset() {
    setTitle("");
    setCategory("RESORT");
    setUrl("");
    setDescription("");
  }

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
      <DialogContent className="flex max-h-[90vh] max-w-md flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-5 sm:px-6">
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
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="space-y-1.5">
            <Label htmlFor="photo-title" className="text-xs font-medium">
              Title <span className="text-destructive">*</span>
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
              <SelectTrigger className="h-10 whitespace-nowrap">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_VALUES.map((c) => (
                  <SelectItem key={c} value={c} className="whitespace-nowrap">
                    {prettify(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Image <span className="text-destructive">*</span>
            </Label>
            <ImageUploader
              onUploaded={(uploadedUrl) => setUrl(uploadedUrl)}
              disabled={mutation.isPending}
              label="Upload image"
            />
            {url && (
              <p className="text-[11px] text-muted-foreground">
                Uploaded: <span className="font-mono text-foreground">{url}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="photo-desc" className="text-xs font-medium">
              Description (optional)
            </Label>
            <Textarea
              id="photo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Add context for viewers — e.g., what's special about this view"
            />
          </div>

          </div>

          <DialogFooter className="flex shrink-0 flex-row gap-2 border-t border-border bg-card px-4 py-4 sm:px-6">
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
