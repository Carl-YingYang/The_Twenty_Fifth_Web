"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Users,
  Search,
  ArrowRight,
  ArrowDown,
  Star,
  Quote,
  Leaf,
  Waves,
  TreePine,
  Sparkles,
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
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { useViewStore } from "@/store/useViewStore";
import { useBookingStore } from "@/store/useBookingStore";
import type { Room, Amenity } from "@/types";
import { RoomCard } from "../RoomCard";
import { FadeUpSection, HERO_IMAGE, getAmenityIcon } from "../shared";

const GALLERY_TEASER_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1575340122733-83724d2756c0?auto=format&fit=crop&w=900&q=80",
    title: "Infinity Pool at Dusk",
    span: "sm:col-span-2 sm:row-span-2",
  },
  {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    title: "Private Beach",
    span: "",
  },
  {
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    title: "Rainforest Canopy",
    span: "",
  },
  {
    url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80",
    title: "Farm-to-Table Dining",
    span: "sm:col-span-2",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Verdara is the rare place that feels both effortless and considered. We woke to birdsong, slept to waves, and never wanted to leave the canopy.",
    author: "Eleanor & James Whitfield",
    origin: "London, United Kingdom",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  },
  {
    quote:
      "From the moment our private car arrived at the gate, every detail felt intentional. The Pool Villa is pure poetry — the staff anticipated needs we hadn't even named.",
    author: "Sofia Reyes",
    origin: "Manila, Philippines",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80",
  },
  {
    quote:
      "I've stayed at Aman, Soneva, and Nihi. Verdara belongs in that conversation — and in some ways, exceeds it. The forest spa alone is worth the journey.",
    author: "Hiroshi Tanaka",
    origin: "Tokyo, Japan",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
  },
];

export function HomePage() {
  const navigate = useViewStore((s) => s.navigate);
  const setSearch = useBookingStore((s) => s.setSearch);
  const booking = useBookingStore();

  const [checkIn, setCheckIn] = React.useState(booking.checkIn || defaultDate(1));
  const [checkOut, setCheckOut] = React.useState(booking.checkOut || defaultDate(3));
  const [adults, setAdults] = React.useState(String(booking.adults || 2));
  const [children, setChildren] = React.useState(String(booking.children || 0));

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms", "featured"],
    queryFn: () => apiFetch<{ rooms: Room[] }>("/api/rooms"),
  });
  const featuredRooms = (roomsData?.rooms ?? []).slice(0, 3);

  const { data: amenitiesData } = useQuery({
    queryKey: ["amenities", "home"],
    queryFn: () => apiFetch<{ amenities: Amenity[] }>("/api/amenities"),
  });
  const featuredAmenities = (amenitiesData?.amenities ?? []).slice(0, 6);

  const onSearch = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select your check-in and check-out dates");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      toast.error("Check-out must be after check-in");
      return;
    }
    setSearch({
      checkIn,
      checkOut,
      adults: parseInt(adults, 10) || 2,
      children: parseInt(children, 10) || 0,
    });
    navigate("book");
  };

  return (
    <div>
      {/* ============================================================
          Hero
      ============================================================ */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />

        <div className="container-luxury relative z-10 flex flex-col items-center text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.25em] backdrop-blur"
          >
            <Leaf className="h-3 w-3" />
            Welcome to Verdara
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            A Sanctuary Between
            <br />
            <span className="italic text-emerald-200">Forest &amp; Sea</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-6 max-w-xl text-base text-white/80 sm:text-lg"
          >
            Private villas tucked into the rainforest canopy. Farm-to-table dining under the stars.
            An immersive luxury escape on the coast of Batangas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button
              onClick={() => navigate("book")}
              size="lg"
              className="rounded-full bg-white px-7 text-primary shadow-lg hover:bg-white/90"
            >
              Book Your Stay
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => navigate("rooms")}
              size="lg"
              variant="outline"
              className="rounded-full border-white/30 bg-white/5 px-7 text-white backdrop-blur hover:bg-white/15"
            >
              Explore Rooms
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-32 left-1/2 z-10 -translate-x-1/2 text-white/70"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
            <ArrowDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ============================================================
          Quick Availability Search Bar (floating)
      ============================================================ */}
      <section className="relative z-20 -mt-20 px-4 sm:-mt-24">
        <div className="container-luxury">
          <FadeUpSection>
            <Card className="rounded-2xl border-border/60 bg-white p-5 shadow-luxury-lg sm:p-6">
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="hero-checkin" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Check-in
                  </Label>
                  <div className="relative">
                    <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="hero-checkin"
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="rounded-xl pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hero-checkout" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Check-out
                  </Label>
                  <div className="relative">
                    <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="hero-checkout"
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="rounded-xl pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Adults</Label>
                  <Select value={adults} onValueChange={setAdults}>
                    <SelectTrigger className="w-full rounded-xl">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} {n === 1 ? "Adult" : "Adults"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Children</Label>
                  <Select value={children} onValueChange={setChildren}>
                    <SelectTrigger className="w-full rounded-xl">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} {n === 1 ? "Child" : "Children"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={onSearch} size="lg" className="rounded-full px-7">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
            </Card>
          </FadeUpSection>
        </div>
      </section>

      {/* ============================================================
          Featured Rooms
      ============================================================ */}
      <section className="py-20 sm:py-24">
        <div className="container-luxury">
          <FadeUpSection className="mb-10 flex flex-col items-end justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
                Accommodations
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Signature Villas &amp; Suites
              </h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Each residence is thoughtfully designed with natural materials, premium linens,
                and seamless indoor-outdoor living. Find the sanctuary that speaks to you.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("rooms")}
              className="rounded-full text-primary"
            >
              View all rooms
              <ArrowRight className="h-4 w-4" />
            </Button>
          </FadeUpSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {roomsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <RoomCardSkeletonWrapper key={i} />
                ))
              : featuredRooms.map((room, i) => (
                  <FadeUpSection key={room.id} delay={i * 0.08}>
                    <RoomCard
                      room={room}
                      onDetails={(r) => navigate("room-details", { roomId: r.id })}
                      onBook={(r) => {
                        setSearch({ selectedRoomId: r.id });
                        navigate("book");
                      }}
                    />
                  </FadeUpSection>
                ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          Amenities Preview
      ============================================================ */}
      <section className="bg-section py-20 sm:py-24">
        <div className="container-luxury">
          <FadeUpSection className="mb-10 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Resort Experiences
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Every Comfort Considered
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              From the spa pavilion hidden in the rainforest to the chef's farm-to-table kitchen,
              every detail is curated for stillness and discovery.
            </p>
          </FadeUpSection>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {featuredAmenities.map((amenity, i) => {
              const Icon = getAmenityIcon(amenity.icon);
              return (
                <FadeUpSection key={amenity.id} delay={i * 0.05}>
                  <div className="group flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-6 text-center shadow-luxury transition-all hover:-translate-y-1 hover:shadow-luxury-lg">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-medium">{amenity.name}</span>
                  </div>
                </FadeUpSection>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Button
              variant="outline"
              onClick={() => navigate("amenities")}
              className="rounded-full"
            >
              Explore all amenities
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================
          Gallery Teaser
      ============================================================ */}
      <section className="py-20 sm:py-24">
        <div className="container-luxury">
          <FadeUpSection className="mb-10 flex flex-col items-end justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
                Gallery
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Moments at Verdara
              </h2>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("gallery")}
              className="rounded-full text-primary"
            >
              View full gallery
              <ArrowRight className="h-4 w-4" />
            </Button>
          </FadeUpSection>

          <FadeUpSection>
            <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {GALLERY_TEASER_IMAGES.map((img, i) => (
                <button
                  key={i}
                  onClick={() => navigate("gallery")}
                  className={`group relative overflow-hidden rounded-2xl ${img.span}`}
                >
                  { }
                  <img
                    src={img.url}
                    alt={img.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
                  <div className="absolute bottom-0 left-0 p-4 text-left">
                    <p className="text-sm font-medium text-white">{img.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </FadeUpSection>
        </div>
      </section>

      {/* ============================================================
          Experience / About Teaser
      ============================================================ */}
      <section className="bg-section py-20 sm:py-24">
        <div className="container-luxury">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <FadeUpSection>
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-luxury-lg">
                { }
                <img
                  src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80"
                  alt="Forest spa pavilion"
                  className="h-full w-full object-cover"
                />
              </div>
            </FadeUpSection>
            <FadeUpSection delay={0.1}>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
                Our Philosophy
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Where Nature Meets Luxury
              </h2>
              <p className="mt-4 text-muted-foreground">
                Verdara was born from a simple belief: that true luxury is the feeling of being
                wholly present. Our villas are built around the rainforest, not in spite of it.
                Our spa draws from traditional Filipino healing. Our kitchen cooks what the land
                offers, the day it offers it.
              </p>
              <p className="mt-4 text-muted-foreground">
                Here, time slows. The canopy becomes your ceiling. The cove becomes your horizon.
                And every detail — from the handwoven linens to the butler's quiet anticipation —
                is in service of a single, simple feeling: that you have arrived.
              </p>
              <div className="mt-8 flex flex-wrap gap-6">
                <div>
                  <div className="flex items-center gap-1.5 text-primary">
                    <TreePine className="h-5 w-5" />
                    <span className="font-display text-2xl font-semibold">12 acres</span>
                  </div>
                  <p className="text-xs text-muted-foreground">of rainforest preserved</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-primary">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-display text-2xl font-semibold">5-star</span>
                  </div>
                  <p className="text-xs text-muted-foreground">consistently rated</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-primary">
                    <Waves className="h-5 w-5" />
                    <span className="font-display text-2xl font-semibold">230m</span>
                  </div>
                  <p className="text-xs text-muted-foreground">private coastline</p>
                </div>
              </div>
              <Button
                onClick={() => navigate("about")}
                className="mt-8 rounded-full"
                size="lg"
              >
                Read our story
                <ArrowRight className="h-4 w-4" />
              </Button>
            </FadeUpSection>
          </div>
        </div>
      </section>

      {/* ============================================================
          Testimonials
      ============================================================ */}
      <section className="py-20 sm:py-24">
        <div className="container-luxury">
          <FadeUpSection className="mb-10 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Guest Stories
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Whispers from the Canopy
            </h2>
          </FadeUpSection>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <FadeUpSection key={i} delay={i * 0.08}>
                <Card className="flex h-full flex-col gap-5 rounded-2xl border-border/60 p-7 shadow-luxury">
                  <Quote className="h-8 w-8 text-primary/30" />
                  <p className="flex-1 text-sm leading-relaxed text-foreground/80">
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                    { }
                    <img
                      src={t.avatar}
                      alt={t.author}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-sm font-medium">{t.author}</div>
                      <div className="text-xs text-muted-foreground">{t.origin}</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </Card>
              </FadeUpSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA Banner
      ============================================================ */}
      <section className="relative overflow-hidden bg-[#0F2E22] py-20 text-white sm:py-28">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container-luxury relative z-10 text-center">
          <FadeUpSection>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-300">
              Your sanctuary awaits
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Begin Your Verdara Story
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-white/70">
              Reserve your stay today. Our concierge will reach out within 24 hours to begin
              shaping your experience — from airport transfer to in-villa dining.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                onClick={() => navigate("book")}
                size="lg"
                className="rounded-full bg-white px-7 text-primary hover:bg-white/90"
              >
                Book Your Stay
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate("contact")}
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/5 px-7 text-white backdrop-blur hover:bg-white/15"
              >
                Speak to a concierge
              </Button>
            </div>
          </FadeUpSection>
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

function RoomCardSkeletonWrapper() {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border/60">
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-9 w-full animate-pulse rounded-full bg-muted" />
      </div>
    </Card>
  );
}
