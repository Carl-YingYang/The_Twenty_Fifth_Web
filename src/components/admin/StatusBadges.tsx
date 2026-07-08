"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BOOKING_STATUS_CONFIG,
  ROOM_STATUS_CONFIG,
} from "@/lib/constants";

interface BookingStatusBadgeProps {
  status: string;
  /** When true, show the long guest-facing phrase instead of the short label. */
  friendly?: boolean;
  className?: string;
}

export function BookingStatusBadge({
  status,
  friendly = false,
  className,
}: BookingStatusBadgeProps) {
  const cfg = BOOKING_STATUS_CONFIG[status] ?? BOOKING_STATUS_CONFIG.PENDING;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: cfg.color }}
        aria-hidden
      />
      {friendly ? cfg.friendly : cfg.label}
    </Badge>
  );
}

interface RoomStatusBadgeProps {
  status: string;
  friendly?: boolean;
  className?: string;
}

export function RoomStatusBadge({
  status,
  friendly = false,
  className,
}: RoomStatusBadgeProps) {
  const cfg = ROOM_STATUS_CONFIG[status] ?? ROOM_STATUS_CONFIG.AVAILABLE;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: cfg.color }}
        aria-hidden
      />
      {friendly ? cfg.friendly : cfg.label}
    </Badge>
  );
}

export default BookingStatusBadge;
