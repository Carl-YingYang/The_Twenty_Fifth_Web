"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BOOKING_STATUS_CONFIG,
  ROOM_STATUS_CONFIG,
} from "@/lib/constants";

export function BookingStatusBadge({ status }: { status: string }) {
  const cfg = BOOKING_STATUS_CONFIG[status] ?? BOOKING_STATUS_CONFIG.PENDING;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border font-medium", cfg.bg, cfg.text, cfg.border)}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </Badge>
  );
}

export function RoomStatusBadge({ status }: { status: string }) {
  const cfg = ROOM_STATUS_CONFIG[status] ?? ROOM_STATUS_CONFIG.AVAILABLE;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border font-medium", cfg.bg, cfg.text, cfg.border)}
    >
      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </Badge>
  );
}
