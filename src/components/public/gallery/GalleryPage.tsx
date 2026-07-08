"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import { GALLERY_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types";
import { FadeUpSection } from "../shared";

interface GalleryResponse {
  gallery: GalleryItem[];
}

export function GalleryPage() {
  const [activeCategory, setActiveCategory] = React.useState<string>("ALL");
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["gallery", activeCategory],
    queryFn: () =>
      apiFetch<GalleryResponse>(
        `/api/gallery${activeCategory !== "ALL" ? `?category=${activeCategory}` : ""}`
      ),
  });

  const items = data?.gallery ?? [];

  // Vary tile sizes for a masonry feel
  const tileSpans = [
    "sm:col-span-2 sm:row-span-2",
    "",
    "",
    "sm:col-span-2",
    "",
    "",
    "sm:row-span-2",
    "",
    "sm:col-span-2",
    "",
    "",
    "sm:col-span-2 sm:row-span-2",
    "",
    "",
    "",
    "sm:col-span-2",
    "sm:row-span-2",
    "",
  ];

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const goNext = () =>
    setLightboxIndex((i) => (i === null ? i : (i + 1) % items.length));
  const goPrev = () =>
    setLightboxIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length));

  // Keyboard navigation
  React.useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
     
  }, [lightboxIndex, items.length]);

  const current = lightboxIndex !== null ? items[lightboxIndex] : null;

  return (
    <div className="pt-16 md:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-section py-16 sm:py-20">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container-luxury relative">
          <FadeUpSection className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Visual Journal
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              The Verdara Gallery
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Moments of light, texture, and quiet — collected from across the resort, the
              rainforest, and the cove.
            </p>
          </FadeUpSection>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="py-12 sm:py-16">
        <div className="container-luxury">
          {/* Filter tabs */}
          <div className="mb-8 flex flex-wrap gap-2">
            {GALLERY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  activeCategory === cat
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:text-foreground"
                )}
              >
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading gallery…
            </div>
          ) : items.length === 0 ? (
            <Card className="rounded-2xl border-dashed py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No images in this category yet. Check back soon.
              </p>
            </Card>
          ) : (
            <motion.div
              layout
              className="grid auto-rows-[200px] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {items.map((item, i) => (
                  <motion.button
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    onClick={() => openLightbox(i)}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl bg-muted shadow-luxury transition-all hover:shadow-luxury-lg",
                      tileSpans[i % tileSpans.length]
                    )}
                  >
                    { }
                    <img
                      src={item.url}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 transition-opacity group-hover:opacity-90" />
                    <div className="absolute bottom-0 left-0 p-4 text-left">
                      <p className="text-xs uppercase tracking-wider text-emerald-200 opacity-90">
                        {item.category}
                      </p>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(o) => !o && closeLightbox()}>
        <DialogContent className="max-w-4xl border-border/60 bg-black/95 p-0 sm:rounded-2xl">
          <DialogTitle className="sr-only">{current?.title ?? "Gallery image"}</DialogTitle>
          {current && (
            <div className="relative">
              { }
              <img
                src={current.url}
                alt={current.title}
                className="max-h-[80vh] w-full object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                <p className="text-xs uppercase tracking-wider text-emerald-200">
                  {current.category}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold">{current.title}</h3>
                {current.description && (
                  <p className="mt-1 text-sm text-white/80">{current.description}</p>
                )}
              </div>

              {items.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30"
                  >
                    ‹
                  </button>
                  <button
                    onClick={goNext}
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30"
                  >
                    ›
                  </button>
                </>
              )}

              <div className="absolute right-4 top-4 flex items-center gap-2 text-xs text-white/60">
                {(lightboxIndex ?? 0) + 1} / {items.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
