"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Loader2, Trash2, CalendarX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { apiFetch, ApiError } from "@/lib/api-client";
import { formatDateShort } from "@/lib/utils";
import type { Room } from "@/types";

// ============================================================
// BlockDatesDialog — admin marks a room unavailable for a date
// range. Also lists existing blocks with one-click delete.
// ============================================================

interface BlockedDateEntry {
  id: string;
  roomId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  room: { id: string; number: string; name: string };
}

interface BlockDatesDialogProps {
  rooms: Room[];
  children: React.ReactNode; // trigger element
}

export function BlockDatesDialog({ rooms, children }: BlockDatesDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [roomId, setRoomId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [reason, setReason] = React.useState("");
  const queryClient = useQueryClient();

  // Fetch existing blocks
  const { data: blocksData, isLoading: blocksLoading } = useQuery({
    queryKey: ["blocked-dates"],
    queryFn: () => apiFetch<{ blocks: BlockedDateEntry[] }>("/api/calendar/block"),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data: { roomId: string; startDate: string; endDate: string; reason: string }) =>
      apiFetch<{ block: BlockedDateEntry }>("/api/calendar/block", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Dates blocked successfully.");
      queryClient.invalidateQueries({ queryKey: ["blocked-dates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      // Reset form
      setRoomId("");
      setStartDate("");
      setEndDate("");
      setReason("");
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Failed to block dates.";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/calendar/block/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Block removed.");
      queryClient.invalidateQueries({ queryKey: ["blocked-dates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Failed to remove block.";
      toast.error(msg);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !startDate || !endDate) {
      toast.error("Please select a room and date range.");
      return;
    }
    createMutation.mutate({ roomId, startDate, endDate, reason: reason.trim() });
  }

  // Default start date = today, end date = tomorrow
  React.useEffect(() => {
    if (open && !startDate) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(today.toISOString().split("T")[0]);
      setEndDate(tomorrow.toISOString().split("T")[0]);
    }
  }, [open, startDate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-border px-4 py-5 sm:px-6">
          <DialogTitle className="flex items-center gap-2 font-display text-xl font-medium tracking-tight">
            <Ban className="size-5 text-red-600" />
            Block Dates
          </DialogTitle>
          <DialogDescription>
            Mark a room unavailable for a date range. Public users will not
            be able to book it during this period.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-5 sm:px-6">
          {/* Create form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="block-room" className="text-sm font-medium">
                Room
              </Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger id="block-room" className="h-10">
                  <SelectValue placeholder="Select a room to block" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="block-start" className="text-sm font-medium">
                  Start date
                </Label>
                <Input
                  id="block-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="block-end" className="text-sm font-medium">
                  End date
                </Label>
                <Input
                  id="block-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="block-reason" className="text-sm font-medium">
                Reason <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="block-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Owner use, Maintenance, Holiday hold"
                className="min-h-[60px] resize-none"
                maxLength={200}
              />
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Blocking…
                </>
              ) : (
                <>
                  <Ban className="size-4" />
                  Block these dates
                </>
              )}
            </Button>
          </form>

          {/* Existing blocks */}
          <div className="mt-6 border-t border-border pt-5">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarX className="size-4 text-muted-foreground" />
              Existing blocks
            </h4>

            {blocksLoading ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Loading…
              </div>
            ) : blocksData?.blocks?.length ? (
              <ul className="mt-3 space-y-2">
                {blocksData.blocks.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {b.room.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({b.room.number})
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateShort(new Date(b.startDate))} –{" "}
                        {formatDateShort(new Date(b.endDate))}
                      </div>
                      {b.reason && (
                        <div className="mt-0.5 truncate text-xs italic text-muted-foreground">
                          {b.reason}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                      onClick={() => deleteMutation.mutate(b.id)}
                      disabled={deleteMutation.isPending}
                      aria-label="Remove block"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                No active blocks. The calendar is open for all rooms.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
