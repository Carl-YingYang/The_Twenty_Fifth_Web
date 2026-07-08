"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BedDouble, SearchX, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { useViewStore } from "@/store/useViewStore";
import { useBookingStore } from "@/store/useBookingStore";
import type { Room, RoomType } from "@/types";
import { RoomCard } from "../RoomCard";
import { FadeUpSection } from "../shared";

interface RoomsApiResponse {
  rooms: Room[];
}
interface RoomTypesApiResponse {
  roomTypes: RoomType[];
}

export function RoomsPage() {
  const navigate = useViewStore((s) => s.navigate);
  const setSearch = useBookingStore((s) => s.setSearch);

  const [typeFilter, setTypeFilter] = React.useState("ALL");
  const [sort, setSort] = React.useState("RECOMMENDED");

  const { data, isLoading } = useQuery({
    queryKey: ["rooms", "list"],
    queryFn: () => apiFetch<RoomsApiResponse>("/api/rooms"),
  });

  const { data: typesData } = useQuery({
    queryKey: ["roomTypes"],
    queryFn: () => apiFetch<RoomTypesApiResponse>("/api/rooms/types"),
  });

  const rooms = React.useMemo(() => {
    let list = data?.rooms ?? [];
    if (typeFilter !== "ALL") {
      list = list.filter((r) => r.type?.slug === typeFilter);
    }
    list = [...list];
    switch (sort) {
      case "PRICE_LOW":
        list.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case "PRICE_HIGH":
        list.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case "CAPACITY":
        list.sort((a, b) => b.capacity - a.capacity);
        break;
      default:
        break;
    }
    return list;
  }, [data, typeFilter, sort]);

  return (
    <div className="pt-16 md:pt-20">
      {/* Header */}
      <section className="relative overflow-hidden bg-section py-16 sm:py-20">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container-luxury relative">
          <FadeUpSection className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Accommodations
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Residences &amp; Villas
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Thirteen thoughtfully designed sanctuaries, each with its own character — from
              treetop nests to oceanfront penthouses and a flagship two-story presidential villa.
            </p>
          </FadeUpSection>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="sticky top-16 z-30 border-b border-border/60 bg-background/90 backdrop-blur md:top-20">
        <div className="container-luxury py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filter</span>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] rounded-full">
                <SelectValue placeholder="Room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All room types</SelectItem>
                {typesData?.roomTypes.map((t) => (
                  <SelectItem key={t.id} value={t.slug}>
                    {t.name} · {formatCurrency(t.basePrice)}+
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Sort by</span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[170px] rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECOMMENDED">Recommended</SelectItem>
                  <SelectItem value="PRICE_LOW">Price: Low to High</SelectItem>
                  <SelectItem value="PRICE_HIGH">Price: High to Low</SelectItem>
                  <SelectItem value="CAPACITY">Capacity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="py-12 sm:py-16">
        <div className="container-luxury">
          <p className="mb-6 text-sm text-muted-foreground">
            {isLoading ? "Loading rooms…" : `${rooms.length} residence${rooms.length === 1 ? "" : "s"} available`}
          </p>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <RoomCardSkeletonCard key={i} />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <EmptyState
              onReset={() => {
                setTypeFilter("ALL");
                setSort("RECOMMENDED");
              }}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room, i) => (
                <FadeUpSection key={room.id} delay={(i % 3) * 0.06}>
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
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-4 rounded-2xl border-dashed py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="h-6 w-6" />
      </span>
      <div>
        <h3 className="font-display text-lg font-semibold">No rooms match your filters</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters to see more residences.
        </p>
      </div>
      <Button onClick={onReset} variant="outline" className="rounded-full">
        Reset filters
      </Button>
    </Card>
  );
}

function RoomCardSkeletonCard() {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border/60">
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
        <BedDouble className="h-10 w-10 text-muted-foreground/40" />
      </div>
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-9 w-full animate-pulse rounded-full bg-muted" />
      </div>
    </Card>
  );
}
