"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  SlidersHorizontal,
  X,
  ArrowDownWideNarrow,
  Users as UsersIcon,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn, formatCurrency } from "@/lib/utils";
import { useViewStore } from "@/store/useViewStore";
import { useBookingStore } from "@/store/useBookingStore";
import type { Room } from "@/types";
import { RoomCard, RoomCardSkeleton } from "../RoomCard";
import { FadeUpSection, SectionHeading } from "../shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoomsApiResponse {
  rooms: Room[];
}

type Filter = "ALL" | "WHOLE_VILLA" | "BEDROOMS";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "WHOLE_VILLA", label: "Whole Villa" },
  { value: "BEDROOMS", label: "Bedrooms" },
];

type SortKey =
  | "RECOMMENDED"
  | "PRICE_LOW"
  | "PRICE_HIGH"
  | "CAPACITY_HIGH"
  | "NAME_AZ";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "RECOMMENDED", label: "Recommended" },
  { value: "PRICE_LOW", label: "Price: Low to High" },
  { value: "PRICE_HIGH", label: "Price: High to Low" },
  { value: "CAPACITY_HIGH", label: "Sleeps: Most first" },
  { value: "NAME_AZ", label: "Name: A → Z" },
];

const CAPACITY_OPTIONS = [
  { value: "0", label: "Any guests" },
  { value: "2", label: "2+ guests" },
  { value: "4", label: "4+ guests" },
  { value: "8", label: "8+ guests" },
  { value: "12", label: "12+ guests" },
  { value: "16", label: "16+ guests" },
] as const;

export function RoomsPage() {
  const navigate = useViewStore((s) => s.navigate);
  const setSearch = useBookingStore((s) => s.setSearch);
  const [filter, setFilter] = React.useState<Filter>("ALL");
  const [sort, setSort] = React.useState<SortKey>("RECOMMENDED");
  const [minCapacity, setMinCapacity] = React.useState<number>(0);

  const { data, isLoading } = useQuery({
    queryKey: ["rooms", "list"],
    queryFn: () => apiFetch<RoomsApiResponse>("/api/rooms"),
  });

  const allRooms = data?.rooms ?? [];

  // Find the price bounds so we can show "starts at" hints on chips.
  const priceBounds = React.useMemo(() => {
    if (allRooms.length === 0) return { min: 0, max: 0 };
    const prices = allRooms.map((r) => r.pricePerNight);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [allRooms]);

  const rooms = React.useMemo(() => {
    let list = [...allRooms];
    // Category filter
    if (filter === "WHOLE_VILLA") {
      list = list.filter((r) => r.type?.slug === "whole-villa");
    } else if (filter === "BEDROOMS") {
      list = list.filter((r) => r.type?.slug !== "whole-villa");
    }
    // Capacity filter
    if (minCapacity > 0) {
      list = list.filter((r) => r.capacity >= minCapacity);
    }
    // Sort
    switch (sort) {
      case "PRICE_LOW":
        list.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case "PRICE_HIGH":
        list.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case "CAPACITY_HIGH":
        list.sort((a, b) => b.capacity - a.capacity);
        break;
      case "NAME_AZ":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "RECOMMENDED":
      default:
        // Whole villa first (highest tier), then by capacity desc as a tiebreaker.
        list.sort((a, b) => {
          const aWhole = a.type?.slug === "whole-villa" ? 1 : 0;
          const bWhole = b.type?.slug === "whole-villa" ? 1 : 0;
          if (aWhole !== bWhole) return bWhole - aWhole;
          return b.capacity - a.capacity;
        });
        break;
    }
    return list;
  }, [allRooms, filter, minCapacity, sort]);

  const hasActiveFilters = filter !== "ALL" || minCapacity > 0 || sort !== "RECOMMENDED";

  const resetFilters = () => {
    setFilter("ALL");
    setMinCapacity(0);
    setSort("RECOMMENDED");
  };

  return (
    <div className="pt-12 sm:pt-16">
      {/* Header */}
      <section className="border-b border-border bg-section py-14 sm:py-20">
        <div className="container-luxury">
          <FadeUpSection>
            <SectionHeading
              eyebrow="The Villa"
              title="The Villa & Bedrooms"
              subtitle="Book the whole villa for a group celebration, or pick a single bedroom suite for a quieter escape. Four configurations, one beachfront address in Botolan, Zambales."
            />
          </FadeUpSection>
          {!isLoading && allRooms.length > 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              {allRooms.length} configurations ·{" "}
              <span className="font-medium text-foreground">
                from {formatCurrency(priceBounds.min)}
              </span>{" "}
              to {formatCurrency(priceBounds.max)} per night
            </p>
          )}
        </div>
      </section>

      {/* Filter + sort bar — sticky below the nav */}
      <div className="sticky top-[64px] z-30 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container-luxury py-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "min-h-[40px] rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                    filter === f.value
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Capacity filter */}
              <div className="flex items-center gap-1.5">
                <UsersIcon className="hidden size-4 text-muted-foreground sm:block" />
                <Select
                  value={String(minCapacity)}
                  onValueChange={(v) => setMinCapacity(Number(v))}
                >
                  <SelectTrigger className="h-[40px] w-[140px] rounded-full border-border bg-card text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPACITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <ArrowDownWideNarrow className="hidden size-4 text-muted-foreground sm:block" />
                <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <SelectTrigger className="h-[40px] w-[180px] rounded-full border-border bg-card text-sm sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="inline-flex h-[40px] items-center gap-1 rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground/70 transition-colors hover:border-destructive/40 hover:text-destructive"
                  aria-label="Reset filters"
                >
                  <X className="size-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Result count */}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            {isLoading
              ? "Loading configurations…"
              : `${rooms.length} of ${allRooms.length} configuration${
                  allRooms.length === 1 ? "" : "s"
                }`}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="py-12 sm:py-16">
        <div className="container-luxury">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <RoomCardSkeleton key={i} />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-20 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <SlidersHorizontal className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No configurations match your filters
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Try removing the capacity requirement or switching back to
                &ldquo;All&rdquo;.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <X className="size-3.5" />
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room, i) => (
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
          )}

          {isLoading && (
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching the villa configurations…
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
