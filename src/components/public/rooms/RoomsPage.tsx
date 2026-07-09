"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useViewStore } from "@/store/useViewStore";
import { useBookingStore } from "@/store/useBookingStore";
import type { Room } from "@/types";
import { RoomCard, RoomCardSkeleton } from "../RoomCard";
import { FadeUpSection, SectionHeading } from "../shared";

interface RoomsApiResponse {
  rooms: Room[];
}

type Filter = "ALL" | "WHOLE_VILLA" | "BEDROOMS";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "WHOLE_VILLA", label: "Whole Villa" },
  { value: "BEDROOMS", label: "Bedrooms" },
];

export function RoomsPage() {
  const navigate = useViewStore((s) => s.navigate);
  const setSearch = useBookingStore((s) => s.setSearch);
  const [filter, setFilter] = React.useState<Filter>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["rooms", "list"],
    queryFn: () => apiFetch<RoomsApiResponse>("/api/rooms"),
  });

  const rooms = React.useMemo(() => {
    const list = data?.rooms ?? [];
    if (filter === "ALL") return list;
    if (filter === "WHOLE_VILLA") {
      return list.filter((r) => r.type?.slug === "whole-villa");
    }
    return list.filter((r) => r.type?.slug !== "whole-villa");
  }, [data, filter]);

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
        </div>
      </section>

      {/* Filter chips */}
      <div className="border-b border-border bg-background">
        <div className="container-luxury py-4">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "min-h-[44px] rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                  filter === f.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
            <p className="ml-auto text-sm text-muted-foreground">
              {isLoading
                ? "Loading…"
                : `${rooms.length} option${rooms.length === 1 ? "" : "s"}`}
            </p>
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
              <p className="text-sm text-muted-foreground">
                No options match this filter. Try another tab.
              </p>
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
