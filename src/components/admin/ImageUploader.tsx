"use client";

import * as React from "react";
import { ImagePlus, Loader2, X, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================
// ImageUploader — drag & drop file picker that uploads to /api/upload
// Returns the hosted URL via onUploaded callback.
// Reusable across admin (room images, gallery) and future flows.
// ============================================================

interface ImageUploaderProps {
  /** Called with the uploaded image URL when upload succeeds */
  onUploaded: (url: string) => void;
  /** Disabled state (e.g., while parent form is submitting) */
  disabled?: boolean;
  /** Compact variant — smaller dropzone */
  compact?: boolean;
  /** Optional label override */
  label?: string;
  /** Accepted file types (default: images only) */
  accept?: string;
  className?: string;
}

const ACCEPTED_TYPES = "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif";

export function ImageUploader({
  onUploaded,
  disabled = false,
  compact = false,
  label = "Upload image",
  accept = ACCEPTED_TYPES,
  className,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);

  const uploadFile = React.useCallback(
    async (file: File) => {
      // Client-side validation
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file (JPG, PNG, WebP, GIF).");
        return;
      }
      const allowed = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif",
      ];
      if (!allowed.includes(file.type)) {
        toast.error(`Unsupported format: ${file.type}. Use JPG, PNG, WebP, GIF, or AVIF.`);
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(
          `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is 8 MB.`
        );
        return;
      }

      // Local preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error ?? "Upload failed");
        }

        toast.success("Image uploaded.");
        onUploaded(data.url);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed.";
        toast.error(msg);
        setPreview(null);
      } finally {
        setIsUploading(false);
        // Revoke preview after a delay so UI can transition
        setTimeout(() => {
          URL.revokeObjectURL(previewUrl);
        }, 1000);
        // Reset input so the same file can be re-selected
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onUploaded]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const openPicker = () => {
    if (!disabled && !isUploading) inputRef.current?.click();
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="sr-only"
        aria-label={label}
        disabled={disabled || isUploading}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-card">
          <img
            src={preview}
            alt="Upload preview"
            className={cn(
              "w-full object-cover",
              compact ? "h-32" : "h-48"
            )}
          />
          {/* Overlay while uploading */}
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-sm">
              <Loader2 className="size-6 animate-spin text-white" />
              <p className="text-xs font-medium text-white">Uploading…</p>
            </div>
          )}
          {!isUploading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 size-7 rounded-md bg-black/60 text-white hover:bg-red-600 hover:text-white"
              onClick={() => setPreview(null)}
              aria-label="Clear preview"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all",
            compact ? "px-3 py-4" : "px-4 py-8",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
            (disabled || isUploading) && "cursor-not-allowed opacity-60"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-105",
              compact ? "size-8" : "size-12"
            )}
          >
            {isUploading ? (
              <Loader2 className={cn("animate-spin", compact ? "size-4" : "size-5")} />
            ) : (
              <UploadCloud className={cn(compact ? "size-4" : "size-5")} />
            )}
          </div>
          <div className="text-center">
            <p className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>
              {isUploading ? "Uploading…" : label}
            </p>
            {!compact && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Drag &amp; drop or click to browse · JPG, PNG, WebP up to 8 MB
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
