"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  Users,
  ArrowRight,
  Quote,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import { useViewStore } from "@/store/useViewStore";
// LQIP (Low Quality Image Placeholder) data — tiny ~400-byte base64 JPEGs
// embedded inline for zero extra network requests. Generated from the full-
// resolution hero photos at build time (see src/lib/hero-lqip.json).
import heroLqip from "@/lib/hero-lqip.json";
import { useBookingStore } from "@/store/useBookingStore";
import { RESORT_INFO } from "@/lib/constants";
import type { Room, Amenity } from "@/types";
import { RoomCard } from "../RoomCard";
import {
  FadeUpSection,
  SectionHeading,
  SectionDivider,
  getAmenityIcon,
  useCountUp,
  SmartImage,
} from "../shared";

const STATS = [
  { value: 4, label: "Bedrooms", display: "4" },
  { value: 21, label: "Beds", display: "21" },
  { value: 5.5, label: "Baths", display: "5.5" },
  { value: 25, label: "Guests", display: "25" },
  { value: 0, label: "Beachfront", display: "Private" },
];

function AnimatedStat({ stat }: { stat: typeof STATS[number] }) {
  const isText = stat.display === "Private";
  const { ref, count } = useCountUp(stat.value, 1400);
  return (
    <div className="text-center">
      <div className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {isText ? stat.display : <span ref={ref}>{stat.value % 1 !== 0 ? count.toFixed(1) : count}</span>}
      </div>
      <div className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-white/60">
        {stat.label}
      </div>
    </div>
  );
}

const GALLERY_TEASER = [
  {
    url: "https://images.unsplash.com/photo-1575340122733-83724d2756c0?auto=format&fit=crop&w=1200&q=80",
    title: "Infinity Pool",
    className: "sm:col-span-2 sm:row-span-2",
  },
  {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    title: "Private Beach",
    className: "",
  },
  {
    url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
    title: "Sunset Pool",
    className: "",
  },
  {
    url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
    title: "Outdoor Dining",
    className: "sm:col-span-2",
  },
];

// Owner-provided hero photography (July 2025):
//  1. Aerial establishing shot of the villa, pool, beach & tropical greenery.
//  2. Tropical beach at sunset — palm trees, thatched umbrellas, lounge chairs.
//  3. Resort pool surrounded by lush palms with a covered pavilion.
// Order: establish → dream → invite.
//
// LQIP blur-up: each slide renders two layers —
//   (1) a tiny (~32px) heavily-blurred JPEG embedded as a base64 data URI
//       so it paints on the very first frame (zero extra network round-trip),
//   (2) the full-resolution WebP on top, which crossfades from opacity 0 → 1
//       and blur(24px) → blur(0) once it finishes loading.
// The result: no blank/dark box ever, and a premium progressive sharpening.
interface HeroSlideDef {
  src: string;
  lqip: string;
}
const HERO_SLIDES: HeroSlideDef[] = [
  { src: "/hero-1.webp", lqip: heroLqip["hero-1"] },
  { src: "/hero-2.webp", lqip: heroLqip["hero-2"] },
  { src: "/hero-3.webp", lqip: heroLqip["hero-3"] },
];

const HERO_INTERVAL_MS = 6500;
const HERO_FADE_MS = 1600; // crossfade duration between slides
const HERO_BLURUP_MS = 900; // blur-up duration when HQ image loads

// Hero slideshow — auto-advancing, pure opacity crossfade, no visible
// controls or captions. Each slide handles its own LQIP blur-up loading.
function HeroSlideshow() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, HERO_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {HERO_SLIDES.map((slide, i) => (
        <HeroSlide
          key={slide.src}
          src={slide.src}
          lqip={slide.lqip}
          active={i === index}
          fadeMs={HERO_FADE_MS}
          blurMs={HERO_BLURUP_MS}
        />
      ))}
    </div>
  );
}

// Single hero slide — LQIP blur-up placeholder + HQ crossfade.
// Two stacked layers inside an absolutely-positioned container:
//   • LQIP layer: always rendered (painted on first frame from base64),
//     blurred + upscaled to fill. Stays visible until HQ is loaded.
//   • HQ layer: <img> on top, starts at opacity 0 + blur(24px), then
//     transitions to opacity 1 + blur(0) when its onLoad fires.
// The container itself crossfades between active/inactive slides.
function HeroSlide({
  src,
  lqip,
  active,
  fadeMs,
  blurMs,
}: {
  src: string;
  lqip: string;
  active: boolean;
  fadeMs: number;
  blurMs: number;
}) {
  const [hqLoaded, setHqLoaded] = React.useState(false);

  // Reset loaded state when the source changes (defensive — shouldn't happen
  // in practice since each slide instance is keyed by src, but keeps the
  // component robust if reused).
  React.useEffect(() => {
    setHqLoaded(false);
  }, [src]);

  return (
    <div
      className="absolute inset-0"
      style={{
        opacity: active ? 1 : 0,
        transition: `opacity ${fadeMs}ms ease-in-out`,
      }}
      aria-hidden={!active}
    >
      {/* LQIP background — tiny base64 JPEG, blurred + scaled to fill.
          Renders instantly; fades out once HQ is loaded so it doesn't
          bleed through the sharp image. */}
      <img
        src={lqip}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
        style={{
          transform: "scale(1.1)",
          filter: "blur(24px)",
          opacity: hqLoaded ? 0 : 1,
          transition: `opacity ${blurMs}ms ease-out`,
        }}
      />
      {/* HQ image — loads on top of the LQIP. Starts blurred + transparent,
          then sharpens + fades in when loaded. */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
        onLoad={() => setHqLoaded(true)}
        style={{
          opacity: hqLoaded ? 1 : 0,
          filter: hqLoaded ? "blur(0px)" : "blur(24px)",
          transform: hqLoaded ? "scale(1)" : "scale(1.05)",
          transition: `opacity ${blurMs}ms ease-out, filter ${blurMs}ms ease-out, transform ${blurMs}ms ease-out`,
        }}
      />
    </div>
  );
}

export function HomePage() {
  const navigate = useViewStore((s) => s.navigate);
  const setSearch = useBookingStore((s) => s.setSearch);
  const booking = useBookingStore();

  const [checkIn, setCheckIn] = React.useState(
    booking.checkIn || defaultDate(1)
  );
  const [checkOut, setCheckOut] = React.useState(
    booking.checkOut || defaultDate(3)
  );
  const [guests, setGuests] = React.useState(
    String(booking.adults + booking.children || 2)
  );

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms", "home"],
    queryFn: () => apiFetch<{ rooms: Room[] }>("/api/rooms"),
  });
  const rooms = roomsData?.rooms ?? [];

  const { data: amenitiesData } = useQuery({
    queryKey: ["amenities", "home"],
    queryFn: () => apiFetch<{ amenities: Amenity[] }>("/api/amenities"),
  });
  const featuredAmenities = (amenitiesData?.amenities ?? []).slice(0, 6);

  const onCheckAvailability = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please pick your check-in and check-out dates");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      toast.error("Check-out must be after check-in");
      return;
    }
    const totalGuests = parseInt(guests, 10) || 2;
    setSearch({
      checkIn,
      checkOut,
      adults: totalGuests,
      children: 0,
    });
    navigate("book");
  };

  return (
    <div>
      {/* ============================================================
          HERO
      ============================================================ */}
      <section className="relative flex min-h-[68vh] items-end overflow-hidden sm:min-h-[80vh] lg:min-h-[88vh]">
        <HeroSlideshow />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/40" />

        <div className="container-luxury relative z-10 flex flex-col items-start pt-20 pb-16 text-white sm:pb-20 lg:pb-28">
          <FadeUpSection>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-white/80 sm:text-xs sm:tracking-[0.32em]">
              Botolan · Zambales
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl sm:leading-[1.05] lg:text-6xl">
              A beachfront villa all your own.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-lg">
              {RESORT_INFO.description}
            </p>
          </FadeUpSection>
        </div>
      </section>

      {/* Floating Check Availability card — sits in its own section so it can
          overlap the hero via negative margin without being clipped by the
          hero's overflow-hidden, and without pushing into "Our Story". */}
      <section className="relative z-20 -mt-16 px-4 sm:-mt-20 lg:-mt-24">
        <div className="container-luxury">
          <FadeUpSection delay={0.15}>
            <div className="rounded-lg border border-border bg-card p-4 shadow-card-hover sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="hero-checkin"
                    className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Check-in
                  </Label>
                  <div className="relative">
                    <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                    <Input
                      id="hero-checkin"
                      type="date"
                      value={checkIn}
                      min={defaultDate(0)}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="rounded-lg border-border bg-muted/30 pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="hero-checkout"
                    className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Check-out
                  </Label>
                  <div className="relative">
                    <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                    <Input
                      id="hero-checkout"
                      type="date"
                      value={checkOut}
                      min={checkIn || defaultDate(1)}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="rounded-lg border-border bg-muted/30 pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Guests
                  </Label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger className="w-full rounded-lg md:w-[140px]">
                      <Users className="h-4 w-4 text-primary" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 25 }).map((_, i) => (
                        <SelectItem key={i} value={String(i + 1)}>
                          {i + 1} {i === 0 ? "Guest" : "Guests"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={onCheckAvailability}
                  size="lg"
                  className="col-span-1 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90 sm:col-span-2 md:col-span-1 md:w-auto"
                >
                  Check Availability
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </FadeUpSection>
        </div>
      </section>

      {/* ============================================================
          STORY / INTRO
      ============================================================ */}
      <section className="border-b border-border py-20 sm:py-24">
        <div className="container-luxury">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <FadeUpSection>
              <p className="eyebrow">Our Story</p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Shaped by the ocean, softened by coastal pine.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                {RESORT_INFO.story}
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                The Twenty-Fifth is an exclusive beachfront villa in Botolan,
                Zambales — a quiet stretch of coast where the days are marked
                only by tides and the sun setting into the West Philippine Sea.
              </p>
              <button
                onClick={() => navigate("about")}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-coral"
              >
                About The Twenty-Fifth
                <ArrowRight className="h-4 w-4" />
              </button>
            </FadeUpSection>

            <FadeUpSection delay={0.1} className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] overflow-hidden rounded-lg">
                <SmartImage
                  src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
                  alt="The Twenty-Fifth villa exterior"
                  className="h-full w-full object-cover"
                  wrapperClassName="h-full w-full"
                  zoom
                />
              </div>
              <div className="mt-8 aspect-[3/4] overflow-hidden rounded-lg">
                <SmartImage
                  src="https://images.unsplash.com/photo-1575340122733-83724d2756c0?auto=format&fit=crop&w=800&q=80"
                  alt="Infinity pool overlooking the sea"
                  className="h-full w-full object-cover"
                  wrapperClassName="h-full w-full"
                  zoom
                />
              </div>
            </FadeUpSection>
          </div>
        </div>
      </section>

      {/* ============================================================
          THE VILLA / BOOKING CONFIGURATIONS
      ============================================================ */}
      <section className="bg-section py-20 sm:py-24">
        <div className="container-luxury">
          <FadeUpSection>
            <SectionHeading
              eyebrow="The Villa"
              title="Choose your stay"
              subtitle="Book the entire villa for a group celebration, or pick a single bedroom suite for a quieter escape. Four configurations, one beachfront address."
              center
            />
          </FadeUpSection>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {roomsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <RoomCardSkeletonCard key={i} />
                ))
              : rooms.map((room, i) => (
                  <FadeUpSection key={room.id} delay={(i % 3) * 0.06}>
                    <RoomCard
                      room={room}
                      onDetails={(r) =>
                        navigate("room-details", { roomId: r.id })
                      }
                      onBook={(r) => {
                        setSearch({ selectedRoomId: r.id });
                        navigate("book");
                      }}
                    />
                  </FadeUpSection>
                ))}
          </div>

          <div className="mt-10 text-center">
            <Button
              variant="outline"
              onClick={() => navigate("rooms")}
              className="rounded-md border-primary/30 text-primary hover:bg-primary hover:text-white"
            >
              See all configurations
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <SectionDivider className="py-6" />

      {/* ============================================================
          AMENITIES PREVIEW
      ============================================================ */}
      <section className="border-b border-border py-20 sm:py-24">
        <div className="container-luxury">
          <FadeUpSection>
            <SectionHeading
              eyebrow="Amenities"
              title="Everything's already here"
              subtitle="From the oceanfront infinity pool to the fully equipped kitchen — every comfort is included, so you can arrive with just a swimsuit and a good book."
            />
          </FadeUpSection>

          <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {featuredAmenities.map((amenity, i) => {
              const Icon = getAmenityIcon(amenity.icon);
              return (
                <FadeUpSection
                  key={amenity.id}
                  delay={(i % 6) * 0.05}
                  className="flex flex-col items-center text-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sand text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {amenity.name}
                  </p>
                </FadeUpSection>
              );
            })}
          </div>

          <div className="mt-10">
            <button
              onClick={() => navigate("amenities")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-coral"
            >
              See all amenities
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          GALLERY TEASER
      ============================================================ */}
      <section className="bg-section py-20 sm:py-24">
        <div className="container-luxury">
          <FadeUpSection>
            <SectionHeading
              eyebrow="Gallery"
              title="A glimpse of the villa"
              subtitle="Sunrises over the sea, golden hour by the pool, long dinners under the palms."
            />
          </FadeUpSection>

          <div className="mt-12 grid auto-rows-[180px] grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {GALLERY_TEASER.map((img, i) => (
              <FadeUpSection
                key={i}
                delay={(i % 4) * 0.05}
                className={`group relative overflow-hidden rounded-lg ${img.className}`}
              >
                <SmartImage
                  src={img.url}
                  alt={img.title}
                  className="h-full w-full object-cover"
                  wrapperClassName="h-full w-full"
                  zoom
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70" />
                <p className="absolute bottom-3 left-3 text-sm font-medium text-white">
                  {img.title}
                </p>
              </FadeUpSection>
            ))}
          </div>

          <div className="mt-8">
            <Button
              variant="outline"
              onClick={() => navigate("gallery")}
              className="rounded-md border-primary/30 text-primary hover:bg-primary hover:text-white"
            >
              View Gallery
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================
          STATS BAND
      ============================================================ */}
      <section className="bg-[#0A3D4A] py-16 text-white sm:py-20">
        <div className="container-luxury">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {STATS.map((s, i) => (
              <FadeUpSection
                key={s.label}
                delay={i * 0.06}
                className="text-center"
              >
                <AnimatedStat stat={s} />
              </FadeUpSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          TESTIMONIAL / PULL QUOTE
      ============================================================ */}
      <section className="py-20 sm:py-28">
        <div className="container-tight">
          <FadeUpSection className="text-center">
            <Quote className="mx-auto h-10 w-10 text-coral" />
            <blockquote className="mx-auto mt-6 max-w-3xl font-display text-2xl font-medium leading-snug tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              &ldquo;You&rsquo;re not just booking a villa, you&rsquo;re
              creating space for connection.&rdquo;
            </blockquote>
            <p className="mt-6 text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
              — The Twenty-Fifth
            </p>
          </FadeUpSection>
        </div>
      </section>

      {/* ============================================================
          CTA BAND
      ============================================================ */}
      <section className="bg-coral py-16 text-coral-foreground sm:py-20">
        <div className="container-luxury flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
          <FadeUpSection>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready for your beach escape?
            </h2>
            <p className="mt-3 max-w-xl text-coral-foreground/85">
              Pick your dates, choose your stay, and we&rsquo;ll handle the
              rest. No payment needed now — we&rsquo;ll confirm by phone or
              Messenger.
            </p>
          </FadeUpSection>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => navigate("book")}
              size="lg"
              className="rounded-md bg-white text-coral hover:bg-white/90"
            >
              Book Your Stay
              <ArrowRight className="h-4 w-4" />
            </Button>
            <a href={`tel:${RESORT_INFO.phoneRaw}`}>
              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-md border-coral-foreground/30 bg-transparent text-coral-foreground hover:bg-coral-foreground/10 sm:w-auto"
              >
                <Phone className="h-4 w-4" />
                {RESORT_INFO.phone}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function defaultDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function RoomCardSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="flex justify-between pt-2">
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
