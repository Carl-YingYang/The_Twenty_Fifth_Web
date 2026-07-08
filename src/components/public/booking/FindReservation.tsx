"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  Loader2,
  ArrowLeft,
  Mail,
  Hash,
  Calendar as CalendarIcon,
  Users,
  BedDouble,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/api-client";
import {
  cn,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import { BOOKING_STATUS_CONFIG } from "@/lib/constants";
import { useViewStore } from "@/store/useViewStore";
import type { Reservation } from "@/types";
import { FadeUpSection } from "../shared";

interface LookupResponse {
  reservation: Reservation;
}

export function FindReservation() {
  const navigate = useViewStore((s) => s.navigate);
  const [referenceNo, setReferenceNo] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [queryKey, setQueryKey] = React.useState<string | null>(null);

  const lookupQuery = useQuery({
    queryKey: ["lookup", queryKey],
    queryFn: () =>
      apiFetch<LookupResponse>(
        `/api/reservations/lookup?referenceNo=${encodeURIComponent(
          referenceNo.trim()
        )}&email=${encodeURIComponent(email.trim())}`
      ),
    enabled: !!queryKey,
    retry: false,
  });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNo.trim() || !email.trim()) {
      toast.error("Please enter both your reference number and email");
      return;
    }
    setQueryKey(`${referenceNo}|${email}|${Date.now()}`);
  };

  const reservation = lookupQuery.data?.reservation;
  const statusConfig = reservation
    ? BOOKING_STATUS_CONFIG[reservation.status] ?? BOOKING_STATUS_CONFIG.PENDING
    : null;

  return (
    <div className="pt-16 md:pt-20">
      {/* Hero */}
      <section className="border-b border-border/60 bg-section py-12 sm:py-16">
        <div className="container-luxury">
          <FadeUpSection className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
              Manage your booking
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Find your reservation
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Enter your reservation reference number and the email used at booking to view your
              reservation details and status.
            </p>
          </FadeUpSection>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-luxury">
          <div className="mx-auto max-w-2xl">
            <FadeUpSection>
              <Card className="rounded-2xl border-border/60 p-6 shadow-luxury sm:p-8">
                <form onSubmit={onSearch} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="find-ref" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Reservation reference
                    </Label>
                    <div className="relative">
                      <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="find-ref"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="RRMS-2025-000123"
                        className="rounded-xl pl-9 font-mono"
                        autoCapitalize="none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="find-email" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Email used at booking
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="find-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="rounded-xl pl-9"
                        autoCapitalize="none"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={lookupQuery.isFetching}
                    className="w-full rounded-full"
                  >
                    {lookupQuery.isFetching ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching…
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Find my reservation
                      </>
                    )}
                  </Button>
                </form>

                {lookupQuery.isError && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                  >
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">Reservation not found</p>
                      <p className="mt-0.5 text-red-600/90">
                        {lookupQuery.error instanceof ApiError
                          ? lookupQuery.error.message
                          : "Please check your reference number and email and try again."}
                      </p>
                    </div>
                  </motion.div>
                )}
              </Card>
            </FadeUpSection>

            {/* Reservation result */}
            {reservation && statusConfig && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-8"
              >
                <Card className="overflow-hidden rounded-2xl border-border/60 shadow-luxury-lg">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F2E22] p-6 text-white sm:p-7">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
                        Reservation
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold tracking-tight">
                        {reservation.referenceNo}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "rounded-full border-0 px-4 py-1.5 text-sm",
                        statusConfig.bg,
                        statusConfig.text
                      )}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="p-6 sm:p-7">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <DetailItem
                        icon={<CalendarIcon className="h-4 w-4" />}
                        label="Check-in"
                        value={`${formatDate(reservation.checkIn)} · 3:00 PM`}
                      />
                      <DetailItem
                        icon={<CalendarIcon className="h-4 w-4" />}
                        label="Check-out"
                        value={`${formatDate(reservation.checkOut)} · 11:00 AM`}
                      />
                      <DetailItem
                        icon={<BedDouble className="h-4 w-4" />}
                        label="Length of stay"
                        value={`${reservation.nights} night${reservation.nights > 1 ? "s" : ""}`}
                      />
                      <DetailItem
                        icon={<Users className="h-4 w-4" />}
                        label="Guests"
                        value={`${reservation.adults} adult${reservation.adults > 1 ? "s" : ""}${
                          reservation.children > 0
                            ? `, ${reservation.children} child${reservation.children > 1 ? "ren" : ""}`
                            : ""
                        }`}
                      />
                    </div>

                    {/* Room info */}
                    {reservation.rooms?.[0]?.room && (
                      <div className="mt-5 rounded-xl bg-section p-4">
                        <div className="text-xs text-muted-foreground">
                          {reservation.rooms[0].room.type?.name} · Room {reservation.rooms[0].room.number}
                        </div>
                        <div className="mt-1 font-display text-lg font-semibold">
                          {reservation.rooms[0].room.name}
                        </div>
                      </div>
                    )}

                    {/* Guest */}
                    {reservation.guest && (
                      <div className="mt-5 border-t border-border/60 pt-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Primary guest
                        </p>
                        <p className="mt-1 font-medium">
                          {reservation.guest.firstName} {reservation.guest.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {reservation.guest.email} · {reservation.guest.phone}
                        </p>
                      </div>
                    )}

                    {/* Special requests */}
                    {reservation.specialRequests && (
                      <div className="mt-5 border-t border-border/60 pt-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Special requests
                        </p>
                        <p className="mt-1 text-sm">{reservation.specialRequests}</p>
                      </div>
                    )}

                    {/* Total */}
                    <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                      <span className="text-sm text-muted-foreground">Total amount</span>
                      <span className="font-display text-xl font-semibold text-primary">
                        {formatCurrency(reservation.totalAmount)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* What does the status mean */}
                <Card className="mt-6 rounded-2xl border-border/60 p-5 shadow-luxury">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className={cn("mt-0.5 h-5 w-5 shrink-0", statusConfig.text)}
                    />
                    <div className="text-sm">
                      <p className="font-medium">{statusConfig.label}</p>
                      <p className="mt-1 text-muted-foreground">
                        {STATUS_EXPLANATIONS[reservation.status] ??
                          "Your reservation is being processed. Our concierge will be in touch shortly."}
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    onClick={() => navigate("contact")}
                    className="rounded-full"
                  >
                    Contact concierge
                  </Button>
                  <Button
                    onClick={() => navigate("home")}
                    variant="outline"
                    className="rounded-full"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-medium">{value}</p>
      </div>
    </div>
  );
}

const STATUS_EXPLANATIONS: Record<string, string> = {
  PENDING:
    "We've received your reservation request. Our concierge will reach out within 24 hours to confirm details and arrange your deposit.",
  CONFIRMED:
    "Your reservation is confirmed and the room is reserved for you. We can't wait to welcome you.",
  CHECKED_IN: "You're currently checked in. Enjoy your stay at Verdara!",
  COMPLETED: "Your stay has concluded. We hope to welcome you back soon.",
  CANCELLED: "This reservation was cancelled. If this is unexpected, please contact our concierge.",
  REJECTED:
    "Unfortunately, we were unable to accommodate this reservation. Please contact our concierge for assistance.",
  NO_SHOW:
    "This reservation was marked as a no-show. Please contact our concierge if you'd like to discuss.",
};
