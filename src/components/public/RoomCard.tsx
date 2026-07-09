"use client";

import * as React from "react";
import { Users, ArrowRight, BedDouble, Ban } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { SmartImage } from "./shared";
import type { Room } from "@/types";

interface RoomCardProps {
  room: Room;
  onSelect?: (room: Room) => void;
  onDetails?: (room: Room) => void;
  onBook?: (room: Room) => void;
  selected?: boolean;
  /** When true (and onSelect is provided) the card is shown as unavailable
   *  for the currently-selected dates and clicks are blocked. */
  booked?: boolean;
  /** Optional reason line shown under the "Booked" badge (e.g. "3 nights unavailable"). */
  bookedReason?: string;
  className?: string;
  compact?: boolean;
}

export function RoomCard({
  room,
  onSelect,
  onDetails,
  onBook,
  selected = false,
  booked = false,
  bookedReason,
  className,
  compact = false,
}: RoomCardProps) {
  const primaryImage = room.images?.find((i) => i.isPrimary) ?? room.images?.[0];
  const imageUrl = primaryImage?.url;
  const typeLabel = room.type?.name ?? "The Villa";
  const disabled = booked && !!onSelect; // only block selection, not details/book flows

  const handleClick = () => {
    if (disabled) return;
    if (onSelect) {
      onSelect(room);
    } else if (onBook) {
      onBook(room);
    } else if (onDetails) {
      onDetails(room);
    }
  };

  return (
    <article
      data-disabled={disabled || undefined}
      aria-label={disabled ? `${room.name} — booked for selected dates` : undefined}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-all duration-300",
        // Interactive affordance only when selectable
        !disabled && "cursor-pointer hover:-translate-y-1 hover:border-primary hover:shadow-card-hover",
        selected && !disabled && "border-primary ring-2 ring-primary/20",
        disabled && "cursor-not-allowed opacity-70 grayscale",
        className
      )}
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <SmartImage
            src={imageUrl}
            alt={primaryImage?.altText ?? room.name}
            className="h-full w-full object-cover"
            wrapperClassName="h-full w-full"
            zoom
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground/40">
            <BedDouble className="h-10 w-10" />
          </div>
        )}

        {/* Capacity badge */}
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-card">
          <Users className="h-3 w-3 text-primary" />
          Sleeps {room.capacity}
        </div>

        {/* Booked badge (only in selection context) */}
        {disabled && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-coral px-2.5 py-1 text-xs font-semibold text-coral-foreground shadow-card">
            <Ban className="h-3 w-3" />
            Booked
          </div>
        )}

        {selected && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/30 backdrop-blur-[1px]">
            <span className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-primary shadow-card">
              Selected
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="eyebrow text-[0.65rem] text-coral">{typeLabel}</p>
        <h3 className="mt-1.5 font-display text-xl font-semibold leading-tight tracking-tight text-foreground">
          {room.name}
        </h3>
        {!compact && room.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {room.description}
          </p>
        )}
        {disabled && bookedReason && (
          <p className="mt-2 text-xs font-medium text-coral">{bookedReason}</p>
        )}

        {/* Footer */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              From
            </div>
            <div className="font-display text-lg font-semibold text-foreground">
              {formatCurrency(room.pricePerNight)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                / night
              </span>
            </div>
          </div>
          {disabled ? (
            <span className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-muted-foreground">
              Unavailable
            </span>
          ) : onDetails ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDetails(room);
              }}
              className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-primary transition-colors duration-200 hover:text-coral"
            >
              View Details
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          ) : onSelect ? (
            <span className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-primary transition-colors duration-200 group-hover:text-coral">
              {selected ? "Selected" : "Choose"}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          ) : (
            <span className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-primary transition-colors duration-200 group-hover:text-coral">
              Book Now
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function RoomCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="flex justify-between pt-2">
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </Card>
  );
}
