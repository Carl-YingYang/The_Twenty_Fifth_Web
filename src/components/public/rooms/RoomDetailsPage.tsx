"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Calendar as CalendarIcon,
  CheckCircle2,
  Loader2,
  Maximize,
  Users,
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
import { FadeUpSection, getAmenityIcon } from "../shared";
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

  React.useEffect(() => {
    // Reset image when room changes.
    setActiveImage(0);
  }, [roomId]);

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
          className="mt-6 rounded-full"
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
                {/* Main image */}
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="relative aspect-[4/3] w-full bg-muted">
                    {primaryImage ? (
                      <img
                        src={primaryImage.url}
                        alt={primaryImage.altText ?? room.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BedDouble className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(i)}
                        className={cn(
                          "relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:w-auto",
                          activeImage === i
                            ? "border-primary"
                            : "border-transparent opacity-70 hover:opacity-100"
                        )}
                      >
                        <img
                          src={img.url}
                          alt={img.altText ?? `View ${i + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
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
                  <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                    <div className="flex items-end justify-between">
                      <div>
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
                          "rounded-full border-0",
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
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>
                          {formatCurrency(room.pricePerNight)} ×{" "}
                          {Math.max(nights, 1)} night
                          {nights === 1 ? "" : "s"}
                        </span>
                        <span className="font-medium text-foreground">
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
                      className="mt-5 w-full rounded-full"
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
                        className="mt-2 w-full rounded-full text-muted-foreground"
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
      <div className="mt-1.5 text-sm font-medium">{value}</div>
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
