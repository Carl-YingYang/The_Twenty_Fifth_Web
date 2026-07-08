"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { AMENITY_CATEGORIES } from "@/lib/constants";
import type { Amenity } from "@/types";
import { FadeUpSection, getAmenityIcon } from "../shared";

interface AmenitiesResponse {
  amenities: Amenity[];
}

export function AmenitiesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["amenities", "all"],
    queryFn: () => apiFetch<AmenitiesResponse>("/api/amenities"),
  });

  const amenities = data?.amenities ?? [];

  // Group by category
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
    <div className="pt-16 md:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-section py-16 sm:py-20">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container-luxury relative">
          <FadeUpSection className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Experiences &amp; Comforts
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Curated for Stillness &amp; Discovery
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              From the spa pavilion hidden in the rainforest to the chef's farm-to-table kitchen,
              every amenity at Verdara is designed to deepen your connection to place — and to
              yourself.
            </p>
          </FadeUpSection>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-luxury space-y-16">
          {isLoading ? (
            <div className="space-y-16">
              {AMENITY_CATEGORIES.map((cat) => (
                <div key={cat.value}>
                  <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-border/60 p-6"
                      >
                        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                        <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-muted" />
                        <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            AMENITY_CATEGORIES.map((cat, idx) => {
              const items = grouped[cat.value] ?? [];
              if (items.length === 0) return null;
              return (
                <FadeUpSection key={cat.value} delay={idx * 0.05}>
                  <div>
                    <div className="mb-6 flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
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

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {items.map((amenity, i) => {
                        const Icon = getAmenityIcon(amenity.icon);
                        return (
                          <motion.div
                            key={amenity.id}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.04, duration: 0.5 }}
                            className="group rounded-2xl border border-border/60 bg-card p-6 shadow-luxury transition-all hover:-translate-y-1 hover:shadow-luxury-lg"
                          >
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                              <Icon className="h-5 w-5" />
                            </span>
                            <h3 className="mt-4 text-base font-semibold">{amenity.name}</h3>
                            {amenity.description && (
                              <p className="mt-1.5 text-sm text-muted-foreground">
                                {amenity.description}
                              </p>
                            )}
                          </motion.div>
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

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  RESORT: "Resort-wide experiences and signature spaces.",
  ROOM: "Thoughtful comforts within every residence.",
  DINING: "Culinary journeys from farm to table.",
  WELLNESS: "Spaces and rituals for body and mind.",
  GENERAL: "Considered essentials, included for every guest.",
};
