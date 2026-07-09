"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
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
              subtitle="Sunrises over the water, golden hour by the pool, long dinners under the palms. A few frames from life at The Twenty-Fifth."
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
                    <button
                      key={item.id}
                      onClick={() => openLightbox(absoluteIdx)}
                      className={cn(
                        "group relative overflow-hidden rounded-lg bg-muted",
                        SPAN_PATTERNS[i % SPAN_PATTERNS.length]
                      )}
                    >
                      <SmartImage
                        src={item.url}
                        alt={item.title}
                        wrapperClassName="absolute inset-0 size-full"
                        className="absolute inset-0 size-full img-zoom"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-90" />
                      <div className="absolute bottom-0 left-0 p-3 text-left sm:p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-coral opacity-95 sm:text-xs">
                          {item.category}
                        </p>
                        <p className="text-xs font-medium text-white sm:text-sm">
                          {item.title}
                        </p>
                      </div>
                    </button>
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
                    {Math.min(currentPage * PAGE_SIZE, items.length)} of {items.length}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Customer-satisfaction section — real guest moments from Facebook */}
      <GuestMoments />

      {/* Lightbox — fixed overlay, 150ms opacity fade only */}
      {current && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 opacity-0 transition-opacity duration-150 [animation:fadeIn_150ms_ease-out_forwards]"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <div className="absolute left-4 top-4 z-10 rounded-md bg-white/10 px-3 py-1.5 text-xs text-white/80">
            {(lightboxIndex ?? 0) + 1} / {items.length}
          </div>

          {/* Prev / Next */}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="Previous image"
                className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4 sm:h-12 sm:w-12"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="Next image"
                className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4 sm:h-12 sm:w-12"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image + caption */}
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.url}
              alt={current.title}
              className="max-h-[80vh] w-auto max-w-full object-contain"
            />
            <div className="mt-4 px-4 text-center text-white">
              <p className="text-[10px] uppercase tracking-[0.2em] text-coral">
                {current.category}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold sm:text-xl">
                {current.title}
              </h3>
              {current.description && (
                <p className="mt-1 text-sm text-white/70">
                  {current.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
