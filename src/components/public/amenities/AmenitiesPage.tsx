"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { AMENITY_CATEGORIES } from "@/lib/constants";
import type { Amenity } from "@/types";
import { FadeUpSection, SectionHeading, getAmenityIcon } from "../shared";

interface AmenitiesResponse {
  amenities: Amenity[];
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  RESORT: "Outdoor spaces and signature amenities across the villa grounds.",
  ROOM: "Quiet comforts inside every bedroom suite.",
  DINING: "Cook, grill, and gather — fully equipped for group meals.",
  WELLNESS: "Spaces and rituals for rest and restoration.",
  GENERAL: "The little things, included for every guest.",
};

export function AmenitiesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["amenities", "all"],
    queryFn: () => apiFetch<AmenitiesResponse>("/api/amenities"),
  });

  const amenities = data?.amenities ?? [];

  const grouped = React.useMemo(() => {
    const map: Record<string, Amenity[]> = {};
    for (const a of amenities) {
      const cat = (a.category as string) ?? "GENERAL";
      if (!map[cat]) map[cat] = [];
      map[cat].push(a);
    }
    return map;
  }, [amenities]);

  return (
    <div className="pt-12 sm:pt-16">
      {/* Header */}
      <section className="border-b border-border bg-section py-14 sm:py-20">
        <div className="container-luxury">
          <FadeUpSection>
            <SectionHeading
              eyebrow="Amenities"
              title="Everything's already here"
              subtitle="From the oceanfront infinity pool to the fully equipped kitchen, every comfort is included. Arrive with just a swimsuit and a good book."
            />
          </FadeUpSection>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-luxury space-y-16">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading amenities…
            </div>
          ) : (
            AMENITY_CATEGORIES.map((cat, idx) => {
              const items = grouped[cat.value] ?? [];
              if (items.length === 0) return null;
              return (
                <FadeUpSection key={cat.value} delay={idx * 0.05}>
                  <div>
                    <div className="mb-6 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand text-primary">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="font-display text-2xl font-semibold tracking-tight">
                          {cat.label}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {CATEGORY_DESCRIPTIONS[cat.value]}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {items.map((amenity) => {
                        const Icon = getAmenityIcon(amenity.icon);
                        return (
                          <div
                            key={amenity.id}
                            className="group rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary sm:p-5"
                          >
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                              <Icon className="h-5 w-5" />
                            </span>
                            <h3 className="mt-4 text-base font-semibold">
                              {amenity.name}
                            </h3>
                            {amenity.description && (
                              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                {amenity.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </FadeUpSection>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
