"use client";

import * as React from "react";
import { Users, Maximize, BedDouble, ArrowRight, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROOM_STATUS_CONFIG } from "@/lib/constants";
import type { Room } from "@/types";

interface RoomCardProps {
  room: Room;
  nights?: number;
  totalPrice?: number;
  isAvailable?: boolean;
  onSelect?: (room: Room) => void;
  onDetails?: (room: Room) => void;
  onBook?: (room: Room) => void;
  showBookButton?: boolean;
  showSelectButton?: boolean;
  selected?: boolean;
  className?: string;
  compact?: boolean;
}

export function RoomCard({
  room,
  nights,
  totalPrice,
  isAvailable,
  onSelect,
  onDetails,
  onBook,
  showBookButton = true,
  showSelectButton = false,
  selected = false,
  className,
  compact = false,
}: RoomCardProps) {
  const primaryImage =
    room.images?.find((i) => i.isPrimary) ?? room.images?.[0];
  const imageUrl = primaryImage?.url;
  const status = ROOM_STATUS_CONFIG[room.status] ?? ROOM_STATUS_CONFIG.AVAILABLE;

  const isUnavailable = isAvailable === false;
  const priceLabel =
    nights && totalPrice
      ? `${formatCurrency(totalPrice)} · ${nights} night${nights > 1 ? "s" : ""}`
      : `${formatCurrency(room.pricePerNight)} / night`;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("h-full", className)}
    >
      <Card
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-luxury transition-all hover:shadow-luxury-lg h-full flex flex-col",
          selected && "ring-2 ring-primary ring-offset-2",
          isUnavailable && "opacity-60"
        )}
      >
        {/* Image */}
        <div
          className={cn(
            "relative w-full overflow-hidden bg-muted",
            compact ? "aspect-[16/10]" : "aspect-[4/3]"
          )}
        >
          {imageUrl ? (
            // Using a plain <img> here to avoid Next.js image domain config for arbitrary Unsplash URLs.
             
            <img
              src={imageUrl}
              alt={primaryImage?.altText ?? room.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-muted-foreground">
              <BedDouble className="h-10 w-10" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {room.type && (
              <Badge className="rounded-full bg-white/90 text-primary shadow-sm backdrop-blur hover:bg-white">
                {room.type.name}
              </Badge>
            )}
          </div>
          <div className="absolute right-3 top-3 flex gap-2">
            {isAvailable === true && (
              <Badge className="rounded-full border-0 bg-emerald-500/95 text-white shadow-sm backdrop-blur hover:bg-emerald-500">
                Available
              </Badge>
            )}
            {isAvailable === false && (
              <Badge className="rounded-full border-0 bg-slate-700/90 text-white shadow-sm backdrop-blur hover:bg-slate-700">
                Unavailable
              </Badge>
            )}
            {isAvailable === undefined && room.status !== "AVAILABLE" && (
              <Badge
                className={cn(
                  "rounded-full border-0 text-white shadow-sm",
                  status.bg,
                  status.text
                )}
              >
                {status.label}
              </Badge>
            )}
          </div>

          {/* Selected overlay */}
          {selected && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
              <div className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-primary shadow-lg">
                Selected
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{room.number}</span>
                {room.view && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="truncate">{room.view} view</span>
                  </>
                )}
              </div>
              <h3 className="mt-0.5 truncate font-display text-lg font-semibold tracking-tight">
                {room.name}
              </h3>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Up to {room.capacity} guests
            </span>
            {room.type?.size && (
              <span className="inline-flex items-center gap-1.5">
                <Maximize className="h-3.5 w-3.5" />
                {room.type.size} m²
              </span>
            )}
            {room.type?.bedConfig && (
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5" />
                {room.type.bedConfig}
              </span>
            )}
          </div>

          {!compact && room.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {room.description}
            </p>
          )}

          {/* Footer */}
          <div className="mt-auto flex items-end justify-between gap-3 pt-2">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {nights && totalPrice ? "Total" : "From"}
              </div>
              <div className="font-display text-base font-semibold text-foreground">
                {priceLabel}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {showSelectButton && (
              <Button
                onClick={() => onSelect?.(room)}
                disabled={isUnavailable}
                className="flex-1 rounded-full"
                size="sm"
              >
                {selected ? "Selected" : "Select"}
              </Button>
            )}
            {showBookButton && !showSelectButton && (
              <Button
                onClick={() => onBook?.(room)}
                disabled={isUnavailable}
                className="flex-1 rounded-full"
                size="sm"
              >
                Book Now
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDetails && (
              <Button
                onClick={() => onDetails(room)}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Eye className="h-3.5 w-3.5" />
                Details
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function RoomCardSkeleton() {
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
