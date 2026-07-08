"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BedDouble, Calendar as CalendarIcon, CheckCircle2, Loader2, Maximize, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import { cn, formatCurrency, formatDate, nightsBetween } from "@/lib/utils";
import { useViewStore } from "@/store/useViewStore";
import { useBookingStore } from "@/store/useBookingStore";
import type { AvailableRoom, Room } from "@/types";
import { FadeUpSection, getAmenityIcon } from "../shared";

interface RoomResponse {
  room: Room;
}
interface AvailabilityResponse {
  available: AvailableRoom[];
  unavailable: AvailableRoom[];
  nights: number;
}

export function RoomDetailsPage() {
  const params = useViewStore((s) => s.params);
  const navigate = useViewStore((s) => s.navigate);
  const booking = useBookingStore();
  const setSearch = useBookingStore((s) => s.setSearch);

  const roomId = params.roomId;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => apiFetch<RoomResponse>(`/api/rooms/${roomId}`),
    enabled: !!roomId,
  });
  const room = data?.room;

  const [checkIn, setCheckIn] = React.useState(booking.checkIn || defaultDate(1));
  const [checkOut, setCheckOut] = React.useState(booking.checkOut || defaultDate(3));
  const [adults, setAdults] = React.useState(String(booking.adults || 2));
  const [children, setChildren] = React.useState(String(booking.children || 0));
  const [activeImage, setActiveImage] = React.useState(0);

  const nights = nightsBetween(checkIn, checkOut);

  // Check availability for this room (only when dates valid)
  const availabilityQuery = useQuery({
    queryKey: ["availability", "room", roomId, checkIn, checkOut, adults, children],
    queryFn: () =>
      apiFetch<AvailabilityResponse>(
        `/api/rooms/availability?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`
      ),
    enabled:
      !!roomId &&
      !!checkIn &&
      !!checkOut &&
      new Date(checkOut) > new Date(checkIn),
  });

  const matchedAvail = availabilityQuery.data?.available.find((r) => r.id === roomId);
  const matchedUnavail = availabilityQuery.data?.unavailable.find((r) => r.id === roomId);
  const isAvailable = matchedAvail !== undefined;
  const availabilityChecked = availabilityQuery.isSuccess && (matchedAvail || matchedUnavail);

  const totalPrice = (room?.pricePerNight ?? 0) * nights;

  if (isLoading) {
    return (
      <div className="container-luxury py-32">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading residence…
        </div>
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="container-luxury py-32 text-center">
        <h1 className="font-display text-2xl font-semibold">Room not found</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn't find the residence you were looking for.
        </p>
        <Button onClick={() => navigate("rooms")} className="mt-6 rounded-full">
          Back to all rooms
        </Button>
      </div>
    );
  }

  const images = room.images ?? [];
  const primaryImage = images[activeImage] ?? images[0];

  const onReserve = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select your check-in and check-out dates");
      return;
    }
    if (nights <= 0) {
      toast.error("Check-out must be after check-in");
      return;
    }
    if (availabilityChecked && !isAvailable) {
      toast.error("This room is not available for the selected dates");
      return;
    }
    if (room.capacity < parseInt(adults, 10) + parseInt(children, 10)) {
      toast.error(`This room accommodates up to ${room.capacity} guests`);
      return;
    }
    setSearch({
      checkIn,
      checkOut,
      adults: parseInt(adults, 10),
      children: parseInt(children, 10),
      selectedRoomId: room.id,
    });
    navigate("book");
  };

  return (
    <div className="pt-16 md:pt-20">
      {/* Breadcrumb */}
      <div className="border-b border-border/60 bg-section">
        <div className="container-luxury py-4">
          <button
            onClick={() => navigate("rooms")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All rooms
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
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                    {room.type.name}
                  </Badge>
                )}
                <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  {room.name}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Room {room.number} · {room.view} view
                  {room.floor ? ` · Floor ${room.floor}` : ""}
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
              {/* Image gallery */}
              <FadeUpSection>
                <div className="overflow-hidden rounded-2xl shadow-luxury">
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

                {images.length > 1 && (
                  <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(i)}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-xl border-2 transition-all",
                          activeImage === i
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-transparent opacity-80 hover:opacity-100"
                        )}
                      >
                        { }
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

              {/* Stats row */}
              <FadeUpSection delay={0.05}>
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile icon={<Users className="h-4 w-4" />} label="Capacity" value={`Up to ${room.capacity} guests`} />
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
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    About this residence
                  </h2>
                  <p className="mt-3 leading-relaxed text-foreground/80">
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
                    <h2 className="font-display text-xl font-semibold tracking-tight">
                      In-residence amenities
                    </h2>
                    <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                      {room.amenities.map((amenity) => {
                        const Icon = getAmenityIcon(amenity.icon);
                        return (
                          <div key={amenity.id} className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <div className="text-sm font-medium">{amenity.name}</div>
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
                  <Card className="rounded-2xl border-border/60 p-6 shadow-luxury-lg">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          From
                        </div>
                        <div className="font-display text-2xl font-semibold text-primary">
                          {formatCurrency(room.pricePerNight)}
                        </div>
                        <div className="text-xs text-muted-foreground">per night</div>
                      </div>
                      {availabilityChecked && (
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                            isAvailable
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          )}
                        >
                          {isAvailable ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {isAvailable ? "Available" : "Unavailable"}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="rd-checkin" className="text-xs uppercase tracking-wider text-muted-foreground">
                          Check-in
                        </Label>
                        <Input
                          id="rd-checkin"
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="rd-checkout" className="text-xs uppercase tracking-wider text-muted-foreground">
                          Check-out
                        </Label>
                        <Input
                          id="rd-checkout"
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Adults</Label>
                        <Select value={adults} onValueChange={setAdults}>
                          <SelectTrigger className="w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: room.capacity }).map((_, i) => (
                              <SelectItem key={i} value={String(i + 1)}>
                                {i + 1} {i === 0 ? "Adult" : "Adults"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Children</Label>
                        <Select value={children} onValueChange={setChildren}>
                          <SelectTrigger className="w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: Math.max(0, room.capacity - 1) + 1 }).map((_, i) => (
                              <SelectItem key={i} value={String(i)}>
                                {i} {i === 1 ? "Child" : "Children"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="mt-5 space-y-2 rounded-xl bg-section p-4 text-sm">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>
                          {formatCurrency(room.pricePerNight)} × {nights} night{nights > 1 ? "s" : ""}
                        </span>
                        <span className="font-medium text-foreground">{formatCurrency(totalPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Service fee (5%)</span>
                        <span className="font-medium text-foreground">{formatCurrency(totalPrice * 0.05)}</span>
                      </div>
                      <div className="my-2 h-px bg-border" />
                      <div className="flex items-center justify-between text-base font-semibold">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(totalPrice * 1.05)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={onReserve}
                      disabled={availabilityChecked && !isAvailable}
                      className="mt-5 w-full rounded-full"
                      size="lg"
                    >
                      {availabilityQuery.isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Checking…
                        </>
                      ) : (
                        <>
                          Reserve
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    {availabilityChecked && !isAvailable && (
                      <p className="mt-3 text-center text-xs text-red-600">
                        This room is unavailable for the selected dates. Try different dates.
                      </p>
                    )}

                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      {formatDate(checkIn)} → {formatDate(checkOut)} · Free cancellation up to 7 days before arrival
                    </p>

                    <Button
                      variant="ghost"
                      onClick={() => navigate("rooms")}
                      className="mt-2 w-full rounded-full text-muted-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to all rooms
                    </Button>
                  </Card>
                </FadeUpSection>
              </div>
            </div>
          </div>
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
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-1.5 text-sm font-medium">{value}</div>
    </div>
  );
}

function defaultDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}
