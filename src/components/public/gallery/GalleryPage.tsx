"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  Tag,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { GALLERY_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types";
import { FadeUpSection, SectionHeading, SmartImage } from "../shared";
import { GuestMoments } from "./GuestMoments";

interface GalleryResponse {
  gallery: GalleryItem[];
}

const PAGE_SIZE = 12;

// Varying row spans for an editorial masonry feel.
const SPAN_PATTERNS = [
  "row-span-2",
  "row-span-1",
  "row-span-1",
  "row-span-2",
  "row-span-1",
  "row-span-2",
  "row-span-1",
  "row-span-1",
];

export function GalleryPage() {
  const [activeCategory, setActiveCategory] = React.useState<string>("ALL");
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["gallery", activeCategory],
    queryFn: () =>
      apiFetch<GalleryResponse>(
        `/api/gallery${activeCategory !== "ALL" ? `?category=${activeCategory}` : ""}`
      ),
  });

  const items = data?.gallery ?? [];

  // Pagination — resets to page 1 when category changes
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  // Offset into the full items array, used for lightbox counter
  const pageOffset = (currentPage - 1) * PAGE_SIZE;

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    setPage(1);
    setLightboxIndex(null);
  }

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const goNext = () =>
    setLightboxIndex((i) => (i === null ? i : (i + 1) % items.length));
  const goPrev = () =>
    setLightboxIndex((i) =>
      i === null ? i : (i - 1 + items.length) % items.length
    );

  // Keyboard navigation — inlined so the effect only depends on the open
  // state + item count (no stale closures over `items`).
  React.useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i === null ? i : (i + 1) % items.length));
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((i) =>
          i === null ? i : (i - 1 + items.length) % items.length
        );
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, items.length]);

  // Lock body scroll when lightbox open
  React.useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  const current = lightboxIndex !== null ? items[lightboxIndex] : null;

  return (
    <div className="pt-12 sm:pt-16">
      {/* Header */}
      <section className="border-b border-border bg-section py-14 sm:py-20">
        <div className="container-luxury">
          <FadeUpSection>
            <SectionHeading
              eyebrow="Gallery"
              title="Moments by the sea"
              subtitle="Sunrises over the water, golden hour by the pool, long dinners under the palms. A few frames from life at The Twenty-Fifth — tap any photo to view it up close."
            />
          </FadeUpSection>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="py-12 sm:py-16">
        <div className="container-luxury">
          {/* Filter tabs */}
          <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {GALLERY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={cn(
                  "shrink-0 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                  activeCategory === cat
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:text-foreground"
                )}
              >
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Count + page info */}
          {!isLoading && items.length > 0 && (
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {items.length} photo{items.length === 1 ? "" : "s"}
                {totalPages > 1 && ` · page ${currentPage} of ${totalPages}`}
              </p>
              <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <Maximize2 className="h-3.5 w-3.5" />
                Tap any photo to enlarge
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading gallery…
            </div>
          ) : items.length === 0 ? (
            <Card className="rounded-lg border-dashed py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No images in this category yet. Check back soon.
              </p>
            </Card>
          ) : (
            <>
              <div className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {paginatedItems.map((item, i) => {
                  const absoluteIdx = pageOffset + i;
                  return (
                    <GalleryTile
                      key={item.id}
                      item={item}
                      span={SPAN_PATTERNS[i % SPAN_PATTERNS.length]}
                      onClick={() => openLightbox(absoluteIdx)}
                    />
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        setLightboxIndex(null);
                      }}
                      disabled={currentPage === 1}
                      className="gap-1.5"
                    >
                      <ChevronLeft className="size-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        const isCurrent = pageNum === currentPage;
                        // Show first, last, current, and neighbors only (avoid huge pager)
                        const show =
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          Math.abs(pageNum - currentPage) <= 1;
                        if (!show) {
                          // Show ellipsis once per gap
                          if (pageNum === 2 && currentPage > 3) {
                            return (
                              <span
                                key={pageNum}
                                className="px-1 text-muted-foreground"
                                aria-hidden
                              >
                                …
                              </span>
                            );
                          }
                          if (
                            pageNum === totalPages - 1 &&
                            currentPage < totalPages - 2
                          ) {
                            return (
                              <span
                                key={pageNum}
                                className="px-1 text-muted-foreground"
                                aria-hidden
                              >
                                …
                              </span>
                            );
                          }
                          return null;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setPage(pageNum);
                              setLightboxIndex(null);
                            }}
                            aria-current={isCurrent ? "page" : undefined}
                            className={cn(
                              "flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors",
                              isCurrent
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-card text-foreground hover:border-primary/40 hover:text-primary"
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPage((p) => Math.min(totalPages, p + 1));
                        setLightboxIndex(null);
                      }}
                      disabled={currentPage === totalPages}
                      className="gap-1.5"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, items.length)} of{" "}
                    {items.length}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Customer-satisfaction section — real guest moments from Facebook */}
      <GuestMoments />

      {/* Centered lightbox modal — Framer Motion animated, split layout on
          desktop (image + details panel), stacked on mobile. */}
      <AnimatePresence>
        {current && (
          <motion.div
            key="gallery-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeLightbox}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={current.title}
          >
            <motion.div
              key="gallery-modal"
              initial={{ opacity: 0, scale: 0.95, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl sm:flex-row"
            >
              {/* Close button */}
              <button
                onClick={closeLightbox}
                aria-label="Close"
                className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/70 hover:scale-105"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>

              {/* Counter badge */}
              <div className="absolute left-3 top-3 z-30 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                {(lightboxIndex ?? 0) + 1} / {items.length}
              </div>

              {/* Image side */}
              <div className="relative flex max-h-[50vh] w-full shrink-0 items-center justify-center overflow-hidden bg-black sm:max-h-none sm:w-[64%]">
                <img
                  src={current.url}
                  alt={current.title}
                  className="h-full w-full object-contain sm:object-cover"
                />
                {/* Prev / Next — overlay on the image, desktop */}
                {items.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/75 hover:scale-105 sm:left-3 sm:h-12 sm:w-12"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                      }}
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/75 hover:scale-105 sm:right-3 sm:h-12 sm:w-12"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Details side */}
              <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-7">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-primary">
                    <Tag className="h-3 w-3" />
                    {current.category}
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
                    {current.title}
                  </h3>
                  {current.description && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {current.description}
                    </p>
                  )}
                </div>

                {/* Footer: counter + nav (mobile shows nav here, desktop uses image overlay) */}
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    {(lightboxIndex ?? 0) + 1} of {items.length}
                  </span>
                  {items.length > 1 && (
                    <div className="flex items-center gap-2 sm:hidden">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          goPrev();
                        }}
                        className="gap-1.5"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          goNext();
                        }}
                        className="gap-1.5"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Use ← → keys to navigate</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------
// GalleryTile — the tappable masonry tile with hover lift + zoom
// + "Tap to view" hint + category badge.
// ------------------------------------------------------------
function GalleryTile({
  item,
  span,
  onClick,
}: {
  item: GalleryItem;
  span: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "group relative block overflow-hidden rounded-lg bg-muted text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        span
      )}
      aria-label={`View ${item.title}`}
    >
      <SmartImage
        src={item.url}
        alt={item.title}
        wrapperClassName="absolute inset-0 size-full"
        className="absolute inset-0 size-full transition-transform duration-700 ease-out group-hover:scale-110"
        loading="lazy"
      />
      {/* Gradient overlay — strengthens on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-95" />

      {/* Category badge — top-left */}
      <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition-colors duration-300 group-hover:bg-white/25">
        {item.category}
      </span>

      {/* "Tap to view" hint — center, fades in on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg">
          <Maximize2 className="h-3 w-3" />
          Tap to view
        </span>
      </div>

      {/* Bottom caption */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        <p className="line-clamp-2 text-xs font-medium leading-snug text-white sm:text-sm">
          {item.title}
        </p>
      </div>
    </motion.button>
  );
}
