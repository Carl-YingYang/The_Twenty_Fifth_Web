"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { cn, formatCurrency, nightsBetween } from "@/lib/utils";
import { useViewStore } from "@/store/useViewStore";
import { useBookingStore } from "@/store/useBookingStore";
import { RESORT_INFO } from "@/lib/constants";
import type { Room } from "@/types";
import { FadeUpSection, getAmenityIcon, SmartImage } from "../shared";
import { RoomCard } from "../RoomCard";

interface RoomResponse {
  room: Room;
}

interface RoomsApiResponse {
  rooms: Room[];
}

export function RoomDetailsPage() {
  const params = useViewStore((s) => s.params);
  const navigate = useViewStore((s) => s.navigate);
  const setSearch = useBookingStore((s) => s.setSearch);
  const booking = useBookingStore();

  const roomId = params.roomId;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => apiFetch<RoomResponse>(`/api/rooms/${roomId}`),
    enabled: !!roomId,
  });
  const room = data?.room;

  // Fetch all rooms for "Other configurations" section
  const { data: allRoomsData } = useQuery({
    queryKey: ["rooms", "list"],
    queryFn: () => apiFetch<RoomsApiResponse>("/api/rooms"),
  });
  const otherRooms = React.useMemo(() => {
    const list = allRoomsData?.rooms ?? [];
    return list.filter((r) => r.id !== roomId).slice(0, 3);
  }, [allRoomsData, roomId]);

  const [activeImage, setActiveImage] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const thumbsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Reset image when room changes.
    setActiveImage(0);
  }, [roomId]);

  // Keep active thumbnail in view when navigating via arrows
  React.useEffect(() => {
    const el = thumbsRef.current?.querySelector<HTMLElement>(
      `[data-thumb-idx="${activeImage}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeImage]);

  // Lightbox keyboard nav — declared before early returns to satisfy rules-of-hooks
  // Uses `room?.images?.length` so it works even before room is loaded
  React.useEffect(() => {
    if (!lightboxOpen) return;
    const total = Math.max(room?.images?.length ?? 0, 1);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight")
        setActiveImage((i) => (i + 1) % total);
      if (e.key === "ArrowLeft")
        setActiveImage((i) => (i - 1 + total) % total);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen, room?.images?.length]);

  if (isLoading) {
    return (
      <div className="container-luxury py-32">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="container-luxury py-32 text-center">
        <h1 className="font-display text-2xl font-semibold">
          We couldn&rsquo;t find that room
        </h1>
        <p className="mt-2 text-muted-foreground">
          The room you&rsquo;re looking for may have been removed.
        </p>
        <Button
          onClick={() => navigate("rooms")}
          className="mt-6 rounded-md"
        >
          Back to The Villa
        </Button>
      </div>
    );
  }

  const images = room.images ?? [];
  const primaryImage = images[activeImage] ?? images[0];
  const nights = nightsBetween(
    booking.checkIn || defaultDate(1),
    booking.checkOut || defaultDate(3)
  );
  const totalPrice = room.pricePerNight * Math.max(nights, 1);

  const onBook = () => {
    if (!booking.checkIn || !booking.checkOut) {
      const ci = defaultDate(1);
      const co = defaultDate(3);
      setSearch({
        checkIn: ci,
        checkOut: co,
        adults: 2,
        children: 0,
        selectedRoomId: room.id,
      });
    } else {
      setSearch({ selectedRoomId: room.id });
    }
    toast.success(`${room.name} selected. Let's pick your dates.`);
    navigate("book");
  };

  return (
    <div className="pt-8 sm:pt-12">
      {/* Back link */}
      <div className="border-b border-border bg-section">
        <div className="container-luxury py-4">
          <button
            onClick={() => navigate("rooms")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            The Villa
          </button>
        </div>
      </div>

      <section className="py-8 sm:py-12">
        <div className="container-luxury">
          {/* Header */}
          <FadeUpSection className="mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                {room.type && (
                  <p className="eyebrow">{room.type.name}</p>
                )}
                <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  {room.name}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {room.view ? `${room.view} view` : ""}
                  {room.view && room.type?.bedConfig ? " · " : ""}
                  {room.type?.bedConfig}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  From
                </div>
                <div className="font-display text-2xl font-semibold text-primary">
                  {formatCurrency(room.pricePerNight)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    / night
                  </span>
                </div>
              </div>
            </div>
          </FadeUpSection>

          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            {/* Gallery + Description */}
            <div>
              <FadeUpSection>
                {/* Main image — 16:10 landscape, click opens lightbox */}
                <div className="group relative overflow-hidden rounded-lg border border-border">
                  <div className="relative aspect-[16/10] w-full">
                    {primaryImage ? (
                      <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        className="absolute inset-0 size-full cursor-zoom-in"
                        aria-label="Open image fullscreen"
                      >
                        <SmartImage
                          src={primaryImage.url}
                          alt={
                            primaryImage.altText?.split("::").pop()?.trim() ??
                            primaryImage.altText ??
                            room.name
                          }
                          wrapperClassName="absolute inset-0 size-full"
                          className="absolute inset-0 size-full"
                          loading="eager"
                        />
                      </button>
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted">
                        <BedDouble className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Caption overlay (bottom gradient) — non-tech users need context */}
                  {primaryImage?.altText && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-10">
                      <p className="text-sm font-medium text-white drop-shadow-sm">
                        {primaryImage.altText.split("::").pop()?.trim() ?? primaryImage.altText}
                      </p>
                    </div>
                  )}

                  {/* Image counter top-right */}
                  {images.length > 1 && (
                    <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {activeImage + 1} / {images.length}
                    </div>
                  )}

                  {/* Click-to-expand hint */}
                  {images.length > 0 && (
                    <div className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                      <Maximize className="size-3" />
                      Click to expand
                    </div>
                  )}
                </div>

                {/* Thumbnails — ALWAYS single-line scrollable, never wraps to 2 lines */}
                {images.length > 1 && (
                  <div className="relative mt-3">
                    <div
                      ref={thumbsRef}
                      className="no-scrollbar flex gap-3 overflow-x-auto pb-2"
                    >
                      {images.map((img, i) => {
                        const caption = img.altText?.split("::").pop()?.trim() ?? img.altText ?? `View ${i + 1}`;
                        return (
                          <button
                            key={img.id}
                            data-thumb-idx={i}
                            onClick={() => setActiveImage(i)}
                            title={caption}
                            className={cn(
                              "group/thumb relative size-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:size-24",
                              activeImage === i
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-transparent opacity-70 hover:opacity-100"
                            )}
                          >
                            <img
                              src={img.url}
                              alt={img.altText ?? `View ${i + 1}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            {/* Caption label — visible on hover, derived from altText */}
                            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-3 text-left text-[10px] font-medium text-white opacity-0 transition group-hover/thumb:opacity-100">
                              {caption}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Chevron arrows — discoverable for non-tech users */}
                    {images.length > 3 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveImage((i) =>
                              (i - 1 + images.length) % images.length
                            )
                          }
                          className="absolute left-0 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md ring-1 ring-border transition hover:bg-white hover:scale-105"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveImage((i) => (i + 1) % images.length)
                          }
                          className="absolute right-0 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md ring-1 ring-border transition hover:bg-white hover:scale-105"
                          aria-label="Next image"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </FadeUpSection>

              {/* Stat row */}
              <FadeUpSection delay={0.05}>
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile
                    icon={<Users className="h-4 w-4" />}
                    label="Sleeps"
                    value={`Up to ${room.capacity}`}
                  />
                  <StatTile
                    icon={<Maximize className="h-4 w-4" />}
                    label="Size"
                    value={room.type?.size ? `${room.type.size} m²` : "—"}
                  />
                  <StatTile
                    icon={<BedDouble className="h-4 w-4" />}
                    label="Beds"
                    value={room.type?.bedConfig ?? "—"}
                  />
                  <StatTile
                    icon={<CalendarIcon className="h-4 w-4" />}
                    label="View"
                    value={room.view ?? "—"}
                  />
                </div>
              </FadeUpSection>

              {/* Description */}
              <FadeUpSection delay={0.1}>
                <div className="mt-10">
                  <h2 className="font-display text-2xl font-semibold tracking-tight">
                    About this stay
                  </h2>
                  <p className="mt-4 leading-relaxed text-foreground/80">
                    {room.description}
                  </p>
                  {room.type?.description && (
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {room.type.description}
                    </p>
                  )}
                </div>
              </FadeUpSection>

              {/* Amenities */}
              {room.amenities && room.amenities.length > 0 && (
                <FadeUpSection delay={0.15}>
                  <div className="mt-10">
                    <h2 className="font-display text-2xl font-semibold tracking-tight">
                      What to expect
                    </h2>
                    <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                      {room.amenities.map((amenity) => {
                        const Icon = getAmenityIcon(amenity.icon);
                        return (
                          <div
                            key={amenity.id}
                            className="flex items-center gap-3"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-primary">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <div className="text-sm font-medium">
                                {amenity.name}
                              </div>
                              {amenity.description && (
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {amenity.description}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </FadeUpSection>
              )}
            </div>

            {/* Sticky booking card */}
            <div>
              <div className="lg:sticky lg:top-24">
                <FadeUpSection delay={0.1}>
                  <div className="rounded-lg border border-border bg-card p-6 shadow-card">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          From
                        </div>
                        <div className="font-display text-2xl font-semibold text-primary">
                          {formatCurrency(room.pricePerNight)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          per night
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "shrink-0 rounded-md border-0",
                          "bg-emerald-50 text-emerald-700"
                        )}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Available
                      </Badge>
                    </div>

                    <div className="mt-5 space-y-2 rounded-lg bg-section p-4 text-sm">
                      <DetailRow
                        label="Check-in"
                        value={`${formatTimeLabel(RESORT_INFO.checkInTime)}`}
                      />
                      <DetailRow
                        label="Check-out"
                        value={`${formatTimeLabel(RESORT_INFO.checkOutTime)}`}
                      />
                      <DetailRow
                        label="Capacity"
                        value={`Up to ${room.capacity} guests`}
                      />
                      <DetailRow
                        label="Beds"
                        value={room.type?.bedConfig ?? "—"}
                      />
                    </div>

                    {/* Price preview */}
                    <div className="mt-4 space-y-2 rounded-lg border border-border p-4 text-sm">
                      <div className="flex items-center justify-between gap-3 text-muted-foreground">
                        <span className="whitespace-nowrap">
                          {formatCurrency(room.pricePerNight)} ×{" "}
                          {Math.max(nights, 1)} night
                          {nights === 1 ? "" : "s"}
                        </span>
                        <span className="shrink-0 font-medium text-foreground">
                          {formatCurrency(totalPrice)}
                        </span>
                      </div>
                      <div className="my-2 h-px bg-border" />
                      <div className="flex items-center justify-between text-base font-semibold">
                        <span>Total</span>
                        <span className="text-primary">
                          {formatCurrency(totalPrice)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        No taxes or service fees. Final total calculated in
                        booking flow.
                      </p>
                    </div>

                    <Button
                      onClick={onBook}
                      size="lg"
                      className="mt-5 w-full items-center gap-2 rounded-md"
                    >
                      Book These Dates
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      No payment needed now — we&rsquo;ll confirm by phone or
                      Messenger.
                    </p>

                    <a href={`tel:${RESORT_INFO.phoneRaw}`}>
                      <Button
                        variant="ghost"
                        className="mt-2 w-full rounded-md text-muted-foreground"
                      >
                        Or call {RESORT_INFO.phone}
                      </Button>
                    </a>
                  </div>
                </FadeUpSection>
              </div>
            </div>
          </div>

          {/* Other configurations */}
          {otherRooms.length > 0 && (
            <FadeUpSection delay={0.2}>
              <div className="mt-16 border-t border-border pt-12">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Other configurations
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Explore more ways to stay at The Twenty-Fifth.
                </p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {otherRooms.map((r, i) => (
                    <FadeUpSection key={r.id} delay={i * 0.06}>
                      <RoomCard
                        room={r}
                        onDetails={(rm) =>
                          navigate("room-details", { roomId: rm.id })
                        }
                        onBook={(rm) => {
                          setSearch({ selectedRoomId: rm.id });
                          navigate("book");
                        }}
                      />
                    </FadeUpSection>
                  ))}
                </div>
              </div>
            </FadeUpSection>
          )}
        </div>
      </section>

      {/* Lightbox — full-screen image viewer */}
      {lightboxOpen && images.length > 0 && (
        <Lightbox
          images={images}
          activeIdx={activeImage}
          setActiveIdx={setActiveImage}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div
        className="mt-1.5 truncate text-sm font-medium"
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function defaultDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function formatTimeLabel(hhmm: string): string {
  // "14:00" -> "2:00 PM"
  const [h, m] = hhmm.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

// ============================================================
// Lightbox — full-screen image viewer with prev/next + keyboard nav
// ============================================================
function Lightbox({
  images,
  activeIdx,
  setActiveIdx,
  onClose,
}: {
  images: Room["images"];
  activeIdx: number;
  setActiveIdx: (updater: (i: number) => number) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = images[activeIdx];
  if (!current) return null;
  const caption =
    current.altText?.split("::").pop()?.trim() ??
    current.altText ??
    `View ${activeIdx + 1}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Close"
      >
        <X className="size-5" />
      </button>

      {/* Counter */}
      <div className="absolute left-4 top-4 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white">
        {activeIdx + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveIdx((i) => (i - 1 + images.length) % images.length);
          }}
          className="absolute left-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Previous image"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {/* Image */}
      <figure
        className="relative max-h-[85vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.url}
          alt={current.altText ?? caption}
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        />
        {caption && (
          <figcaption className="mt-3 text-center text-sm text-white/80">
            {caption}
          </figcaption>
        )}
      </figure>

      {/* Next */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveIdx((i) => (i + 1) % images.length);
          }}
          className="absolute right-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Next image"
        >
          <ChevronRight className="size-6" />
        </button>
      )}
    </div>,
    document.body
  );
}
