"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Mail,
  Hash,
  Calendar as CalendarIcon,
  Users,
  BedDouble,
  CheckCircle2,
  XCircle,
  MessageSquare,
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
import { BOOKING_STATUS_CONFIG, RESORT_INFO } from "@/lib/constants";
import { useViewStore } from "@/store/useViewStore";
import type { Reservation } from "@/types";
import { FadeUpSection, SectionHeading } from "../shared";

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
    <div className="pt-12 sm:pt-16">
      {/* Header */}
      <section className="border-b border-border bg-section py-14 sm:py-20">
        <div className="container-luxury">
          <FadeUpSection>
            <SectionHeading
              eyebrow="Find My Booking"
              title="Find my booking"
              subtitle="Enter your reference number and the email you used to book — we'll pull up your reservation and its current status."
            />
          </FadeUpSection>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-luxury">
          <div className="mx-auto max-w-2xl">
            <FadeUpSection>
              <Card className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
                <form onSubmit={onSearch} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="find-ref"
                      className="text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      Reference number
                    </Label>
                    <div className="relative">
                      <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="find-ref"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="TTF-2026-123456"
                        className="rounded-lg pl-9 font-mono"
                        autoCapitalize="none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="find-email"
                      className="text-xs uppercase tracking-wider text-muted-foreground"
                    >
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
                        className="rounded-lg pl-9"
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
                        Find my booking
                      </>
                    )}
                  </Button>
                </form>

                {lookupQuery.isError && (
                  <div className="mt-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">
                        We couldn&rsquo;t find that booking.
                      </p>
                      <p className="mt-0.5 text-red-600/90">
                        Check your reference number and try again, or message
                        us on Messenger and we&rsquo;ll help.
                      </p>
                      <a
                        href={RESORT_INFO.social.messenger}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-red-700 underline-offset-2 hover:underline"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Message us on Messenger
                      </a>
                    </div>
                  </div>
                )}
              </Card>
            </FadeUpSection>

            {/* Reservation result */}
            {reservation && statusConfig && (
              <FadeUpSection delay={0.05} className="mt-8">
                <Card className="overflow-hidden rounded-xl border border-border shadow-card">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0A3D4A] p-6 text-white sm:p-7">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-coral">
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
                      {statusConfig.friendly}
                    </Badge>
                  </div>

                  {/* Body */}
                  <div className="p-6 sm:p-7">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <DetailItem
                        icon={<CalendarIcon className="h-4 w-4" />}
                        label="Check-in"
                        value={`${formatDate(reservation.checkIn)} · 2:00 PM`}
                      />
                      <DetailItem
                        icon={<CalendarIcon className="h-4 w-4" />}
                        label="Check-out"
                        value={`${formatDate(reservation.checkOut)} · 12:00 PM`}
                      />
                      <DetailItem
                        icon={<BedDouble className="h-4 w-4" />}
                        label="Length of stay"
                        value={`${reservation.nights} night${
                          reservation.nights > 1 ? "s" : ""
                        }`}
                      />
                      <DetailItem
                        icon={<Users className="h-4 w-4" />}
                        label="Guests"
                        value={`${reservation.adults} adult${
                          reservation.adults > 1 ? "s" : ""
                        }${
                          reservation.children > 0
                            ? `, ${reservation.children} child${
                                reservation.children > 1 ? "ren" : ""
                              }`
                            : ""
                        }`}
                      />
                    </div>

                    {/* Room info */}
                    {reservation.rooms?.[0]?.room && (
                      <div className="mt-5 rounded-lg bg-section p-4">
                        <div className="text-xs text-muted-foreground">
                          {reservation.rooms[0].room.type?.name}
                        </div>
                        <div className="mt-1 font-display text-lg font-semibold">
                          {reservation.rooms[0].room.name}
                        </div>
                      </div>
                    )}

                    {/* Guest */}
                    {reservation.guest && (
                      <div className="mt-5 border-t border-border pt-4">
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
                      <div className="mt-5 border-t border-border pt-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Special requests
                        </p>
                        <p className="mt-1 text-sm">
                          {reservation.specialRequests}
                        </p>
                      </div>
                    )}

                    {/* Total */}
                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-sm text-muted-foreground">
                        Total amount
                      </span>
                      <span className="font-display text-xl font-semibold text-primary">
                        {formatCurrency(reservation.totalAmount)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* What happens next */}
                <Card className="mt-6 rounded-xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className={cn("mt-0.5 h-5 w-5 shrink-0", statusConfig.text)}
                    />
                    <div className="text-sm">
                      <p className="font-medium">{statusConfig.friendly}</p>
                      <p className="mt-1 text-muted-foreground">
                        {STATUS_TIMELINE[reservation.status] ??
                          "We're reviewing your request. We'll be in touch shortly."}
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <a
                    href={RESORT_INFO.social.messenger}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full rounded-full sm:w-auto">
                      <MessageSquare className="h-4 w-4" />
                      Message us
                    </Button>
                  </a>
                  <Button
                    onClick={() => navigate("home")}
                    variant="outline"
                    className="w-full rounded-full sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                  </Button>
                </div>
              </FadeUpSection>
            )}

            {/* Help footer (when no search yet) */}
            {!reservation && !lookupQuery.isError && (
              <FadeUpSection delay={0.1} className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Lost your reference number?{" "}
                  <a
                    href={RESORT_INFO.social.messenger}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:text-coral"
                  >
                    Message us on Messenger
                    <ArrowRight className="h-3 w-3" />
                  </a>{" "}
                  and we&rsquo;ll look it up.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => navigate("home")}
                    variant="ghost"
                    className="rounded-full text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                  </Button>
                </div>
              </FadeUpSection>
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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 font-medium">{value}</p>
      </div>
    </div>
  );
}

const STATUS_TIMELINE: Record<string, string> = {
  PENDING:
    "We've received your booking request. We'll review it and reach out by phone or Messenger within 24 hours to confirm your dates.",
  CONFIRMED:
    "Your dates are locked in. We can't wait to welcome you to The Twenty-Fifth!",
  CHECKED_IN:
    "You're currently at the villa. Enjoy your stay — message us if you need anything.",
  COMPLETED:
    "Your stay has wrapped up. We hope to welcome you back to the beach soon.",
  CANCELLED:
    "This reservation was cancelled. If this is unexpected, please message us and we'll help.",
  REJECTED:
    "Unfortunately, we couldn't accommodate this request. Please reach out and we'll try to find alternative dates.",
  NO_SHOW:
    "The reserved dates passed without check-in. Please message us if you'd like to discuss.",
};
