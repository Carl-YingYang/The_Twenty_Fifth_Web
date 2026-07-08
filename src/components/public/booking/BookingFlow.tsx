"use client";

import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  Loader2,
  Minus,
  Plus,
  Phone,
  Users,
  BedDouble,
  Download,
  MessageSquare,
  Home,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiFetch, ApiError } from "@/lib/api-client";
import {
  cn,
  formatCurrency,
  formatDate,
  nightsBetween,
} from "@/lib/utils";
import { useViewStore } from "@/store/useViewStore";
import { useBookingStore } from "@/store/useBookingStore";
import { BOOKING_STATUS_CONFIG, RESORT_INFO } from "@/lib/constants";
import { guestInfoSchema, type GuestInfoInput } from "@/lib/validators";
import type { Reservation, Room } from "@/types";
import { RoomCard, RoomCardSkeleton } from "../RoomCard";
import { FadeUpSection } from "../shared";

interface RoomsResponse {
  rooms: Room[];
}
interface ReservationResponse {
  reservation: Reservation;
}

type Step = 1 | 2 | 3;

const STEPS: { value: Step; label: string }[] = [
  { value: 1, label: "Dates" },
  { value: 2, label: "Details" },
  { value: 3, label: "Confirm" },
];

export function BookingFlow() {
  const navigate = useViewStore((s) => s.navigate);
  const booking = useBookingStore();
  const setSearch = useBookingStore((s) => s.setSearch);
  const selectRoom = useBookingStore((s) => s.selectRoom);

  const [step, setStep] = React.useState<Step>(1);
  const [confirmed, setConfirmed] = React.useState<Reservation | null>(null);
  // Guest details captured in Step 2 — kept in local state because the booking
  // store only holds dates/guests/room (per the lead agent's foundation design).
  const [guestInfo, setGuestInfo] = React.useState<GuestInfoInput>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    specialRequests: "",
  });

  const {
    data: roomsData,
    isLoading: roomsLoading,
  } = useQuery({
    queryKey: ["rooms", "booking-flow"],
    queryFn: () => apiFetch<RoomsResponse>("/api/rooms"),
  });
  const rooms = roomsData?.rooms ?? [];
  const selectedRoom = rooms.find((r) => r.id === booking.selectedRoomId);

  const createMutation = useMutation({
    mutationFn: (payload: {
      roomId: string;
      checkIn: string;
      checkOut: string;
      adults: number;
      children: number;
      guest: GuestInfoInput;
      specialRequests?: string;
    }) =>
      apiFetch<ReservationResponse>("/api/reservations", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setConfirmed(data.reservation);
      setStep(3);
      toast.success("Booking request received!");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.";
      toast.error(msg);
    },
  });

  // Reset confirmation when leaving the flow.
  React.useEffect(() => {
    return () => {
      if (confirmed) {
        // If we have a confirmed booking, reset store on unmount so a fresh
        // visit starts at step 1.
        booking.reset();
      }
    };
  }, [confirmed, booking]);

  // ============== Confirmation screen ==============
  if (confirmed) {
    return (
      <ConfirmationScreen
        reservation={confirmed}
        onReset={() => {
          booking.reset();
          setConfirmed(null);
          setStep(1);
          navigate("home");
        }}
      />
    );
  }

  return (
    <div className="pt-8 sm:pt-12">
      {/* Progress indicator */}
      <div className="border-b border-border bg-section">
        <div className="container-luxury py-5">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {STEPS.map((s, i) => {
              const active = step === s.value;
              const done = step > s.value;
              return (
                <React.Fragment key={s.value}>
                  <button
                    type="button"
                    onClick={() => {
                      // Allow going back to previous steps.
                      if (s.value < step) setStep(s.value);
                    }}
                    disabled={s.value > step}
                    className="flex min-h-[44px] items-center gap-2 px-1"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : done
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : s.value}
                    </span>
                    <span
                      className={cn(
                        "hidden text-sm font-medium transition-colors sm:inline",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <span
                      className={cn(
                        "h-px w-6 sm:w-16",
                        step > s.value ? "bg-primary/40" : "bg-border"
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="py-8 sm:py-12">
        <div className="container-luxury">
          {/* ============================================================
              STEP 1 — Dates & Guests + Choose your stay
          ============================================================ */}
          {step === 1 && (
            <Step1Dates
              booking={booking}
              setSearch={setSearch}
              selectRoom={selectRoom}
              rooms={rooms}
              roomsLoading={roomsLoading}
              selectedRoom={selectedRoom}
              onContinue={() => setStep(2)}
            />
          )}

          {/* ============================================================
              STEP 2 — Your Details
          ============================================================ */}
          {step === 2 && (
            <Step2Details
              defaultValues={guestInfo}
              onBack={() => setStep(1)}
              onContinue={(values) => {
                setGuestInfo(values);
                setStep(3);
              }}
            />
          )}

          {/* ============================================================
              STEP 3 — Review & Confirm
          ============================================================ */}
          {step === 3 && (
            <Step3Confirm
              booking={booking}
              guestInfo={guestInfo}
              selectedRoom={selectedRoom}
              onBack={() => setStep(2)}
              onConfirm={() => {
                if (!selectedRoom) {
                  toast.error("Please choose your stay first");
                  setStep(1);
                  return;
                }
                createMutation.mutate({
                  roomId: selectedRoom.id,
                  checkIn: booking.checkIn,
                  checkOut: booking.checkOut,
                  adults: booking.adults,
                  children: booking.children,
                  guest: guestInfo,
                  specialRequests: guestInfo.specialRequests || undefined,
                });
              }}
              submitting={createMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 1
// ============================================================
function Step1Dates({
  booking,
  setSearch,
  selectRoom,
  rooms,
  roomsLoading,
  selectedRoom,
  onContinue,
}: {
  booking: ReturnType<typeof useBookingStore.getState>;
  setSearch: (patch: Partial<{ checkIn: string; checkOut: string; adults: number; children: number; selectedRoomId: string | null }>) => void;
  selectRoom: (id: string) => void;
  rooms: Room[];
  roomsLoading: boolean;
  selectedRoom?: Room;
  onContinue: () => void;
}) {
  const checkIn = booking.checkIn || defaultDate(1);
  const checkOut = booking.checkOut || defaultDate(3);
  const nights = nightsBetween(checkIn, checkOut);

  const onContinueClick = () => {
    if (!booking.checkIn || !booking.checkOut) {
      setSearch({ checkIn, checkOut });
    }
    if (!selectedRoom) {
      toast.error("Please pick your stay below first");
      return;
    }
    onContinue();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <FadeUpSection>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Pick your dates
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tell us when you&rsquo;d like to visit and how many guests. Then
          choose the whole villa or a single bedroom.
        </p>
      </FadeUpSection>

      {/* Dates + Guests card */}
      <FadeUpSection delay={0.05} className="mt-6">
        <Card className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="bk-checkin"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Check-in
              </Label>
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
                <Input
                  id="bk-checkin"
                  type="date"
                  value={checkIn}
                  min={defaultDate(0)}
                  onChange={(e) =>
                    setSearch({ checkIn: e.target.value })
                  }
                  className="rounded-lg pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="bk-checkout"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Check-out
              </Label>
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
                <Input
                  id="bk-checkout"
                  type="date"
                  value={checkOut}
                  min={checkIn || defaultDate(1)}
                  onChange={(e) =>
                    setSearch({ checkOut: e.target.value })
                  }
                  className="rounded-lg pl-9"
                />
              </div>
            </div>
          </div>

          {/* Guests steppers */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Stepper
              label="Adults"
              hint="Ages 13+"
              value={booking.adults}
              min={1}
              max={25}
              onChange={(v) => setSearch({ adults: v })}
            />
            <Stepper
              label="Children"
              hint="Ages 0–12"
              value={booking.children}
              min={0}
              max={20}
              onChange={(v) => setSearch({ children: v })}
            />
          </div>

          {/* Summary */}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-section px-4 py-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              {formatDate(checkIn)} → {formatDate(checkOut)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              {booking.adults + booking.children} guest
              {booking.adults + booking.children === 1 ? "" : "s"}
            </span>
            <span className="text-muted-foreground">
              {nights} night{nights === 1 ? "" : "s"}
            </span>
          </div>
        </Card>
      </FadeUpSection>

      {/* Selected room summary OR room picker */}
      {selectedRoom ? (
        <FadeUpSection delay={0.1} className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Your stay
            </h2>
            <button
              onClick={() => selectRoom("")}
              className="text-sm font-medium text-primary transition-colors hover:text-coral"
            >
              Change
            </button>
          </div>
          <Card className="mt-4 flex overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="relative aspect-[4/3] w-32 shrink-0 bg-muted sm:w-48">
              {selectedRoom.images?.[0] ? (
                <img
                  src={selectedRoom.images[0].url}
                  alt={selectedRoom.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <BedDouble className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
              <div>
                <p className="eyebrow text-[0.6rem]">
                  {selectedRoom.type?.name}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold">
                  {selectedRoom.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sleeps {selectedRoom.capacity}
                </p>
              </div>
              <div className="mt-3 font-display text-lg font-semibold text-primary">
                {formatCurrency(selectedRoom.pricePerNight)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  / night
                </span>
              </div>
            </div>
          </Card>
        </FadeUpSection>
      ) : (
        <FadeUpSection delay={0.1} className="mt-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Choose your stay
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick the whole villa for a group celebration, or a single bedroom
            for a quieter escape.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roomsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <RoomCardSkeleton key={i} />
                ))
              : rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    selected={room.id === booking.selectedRoomId}
                    onSelect={(r) => selectRoom(r.id)}
                  />
                ))}
          </div>
        </FadeUpSection>
      )}

      {/* Mobile sticky continue bar */}
      <MobileStickyBar>
        <Button
          onClick={onContinueClick}
          size="lg"
          className="w-full rounded-full"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </MobileStickyBar>

      {/* Desktop continue */}
      <div className="mt-8 hidden justify-end sm:flex">
        <Button
          onClick={onContinueClick}
          size="lg"
          className="rounded-full"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// STEP 2
// ============================================================
type Step2Form = GuestInfoInput;

function Step2Details({
  defaultValues,
  onBack,
  onContinue,
}: {
  defaultValues: Step2Form;
  onBack: () => void;
  onContinue: (values: Step2Form) => void;
}) {
  const form = useForm<Step2Form>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues,
    mode: "onTouched",
  });

  const onSubmit = (values: Step2Form) => {
    onContinue(values);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <FadeUpSection>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Your details
        </h1>
        <p className="mt-2 text-muted-foreground">
          We&rsquo;ll use this to confirm your booking and reach out by phone
          or Messenger.
        </p>
      </FadeUpSection>

      <FadeUpSection delay={0.05} className="mt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-card sm:p-7"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Juan"
                        className="rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Dela Cruz"
                        className="rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@email.com"
                        className="rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+63 917 555 0101"
                        className="rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Manila"
                        className="rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Philippines"
                        className="rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialRequests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special requests</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anything we should know? Early check-in, celebration setup, accessibility needs…"
                      className="min-h-[100px] rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Optional. We&rsquo;ll do our best to accommodate.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                size="lg"
                className="rounded-full sm:px-8"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </FadeUpSection>
    </div>
  );
}

// ============================================================
// STEP 3 — Review & Confirm
// ============================================================
function Step3Confirm({
  booking,
  guestInfo,
  selectedRoom,
  onBack,
  onConfirm,
  submitting,
}: {
  booking: ReturnType<typeof useBookingStore.getState>;
  guestInfo: GuestInfoInput;
  selectedRoom?: Room;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const pricePerNight = selectedRoom?.pricePerNight ?? 0;
  const subtotal = pricePerNight * Math.max(nights, 1);
  const total = subtotal; // taxRate = 0 per settings

  if (!selectedRoom || !booking.checkIn || !booking.checkOut) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-muted-foreground">
          Something&rsquo;s missing. Please go back and pick your dates and
          stay.
        </p>
        <Button onClick={onBack} className="mt-4 rounded-full">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <FadeUpSection>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Review &amp; confirm
        </h1>
        <p className="mt-2 text-muted-foreground">
          Take a look at the details below. When you&rsquo;re ready,
          we&rsquo;ll send your request to the villa.
        </p>
      </FadeUpSection>

      <FadeUpSection delay={0.05} className="mt-6">
        <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {/* Stay header */}
          <div className="flex items-center gap-4 border-b border-border bg-section p-5">
            {selectedRoom.images?.[0] ? (
              <img
                src={selectedRoom.images[0].url}
                alt={selectedRoom.name}
                className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted sm:h-20 sm:w-20">
                <BedDouble className="h-6 w-6 text-muted-foreground/40" />
              </div>
            )}
            <div>
              <p className="eyebrow text-[0.6rem]">
                {selectedRoom.type?.name}
              </p>
              <h3 className="mt-0.5 font-display text-lg font-semibold">
                {selectedRoom.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Sleeps {selectedRoom.capacity}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5 p-5 sm:p-7">
            <Section title="Dates">
              <Row label="Check-in" value={`${formatDate(booking.checkIn)}`} />
              <Row
                label="Check-out"
                value={`${formatDate(booking.checkOut)}`}
              />
              <Row
                label="Length of stay"
                value={`${nights} night${nights === 1 ? "" : "s"}`}
              />
            </Section>

            <Section title="Guests">
              <Row
                label="Adults"
                value={`${booking.adults}`}
              />
              {booking.children > 0 && (
                <Row
                  label="Children"
                  value={`${booking.children}`}
                />
              )}
              <Row
                label="Total"
                value={`${booking.adults + booking.children} guest${
                  booking.adults + booking.children === 1 ? "" : "s"
                }`}
              />
            </Section>

            <Section title="Primary guest">
              <Row
                label="Name"
                value={`${guestInfo.firstName ?? ""} ${guestInfo.lastName ?? ""}`.trim()}
              />
              <Row label="Email" value={guestInfo.email ?? ""} />
              <Row label="Phone" value={guestInfo.phone ?? ""} />
              {guestInfo.city || guestInfo.country ? (
                <Row
                  label="From"
                  value={[guestInfo.city, guestInfo.country].filter(Boolean).join(", ")}
                />
              ) : null}
            </Section>

            {guestInfo.specialRequests && (
              <Section title="Special requests">
                <p className="text-sm text-muted-foreground">
                  {guestInfo.specialRequests}
                </p>
              </Section>
            )}

            {/* Price breakdown */}
            <div className="rounded-lg border border-border bg-section p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatCurrency(pricePerNight)} × {nights} night
                  {nights === 1 ? "" : "s"}
                </span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="my-3 h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-semibold">
                  Total
                </span>
                <span className="font-display text-xl font-semibold text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                No taxes or service fees.
              </p>
            </div>

            {/* Plain-language note */}
            <div className="rounded-lg bg-coral/10 p-4 text-sm text-foreground">
              <p className="font-medium">No payment needed now.</p>
              <p className="mt-1 text-muted-foreground">
                We&rsquo;ll review your request, confirm your dates, and reach
                out by phone or Messenger to arrange deposit and details.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                disabled={submitting}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={submitting}
                onClick={() => onConfirm()}
                className="rounded-full sm:px-8"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>Confirm My Booking</>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </FadeUpSection>
    </div>
  );
}

// ============================================================
// CONFIRMATION SCREEN
// ============================================================
function ConfirmationScreen({
  reservation,
  onReset,
}: {
  reservation: Reservation;
  onReset: () => void;
}) {
  const navigate = useViewStore((s) => s.navigate);
  const statusConfig =
    BOOKING_STATUS_CONFIG[reservation.status] ?? BOOKING_STATUS_CONFIG.PENDING;

  const downloadIcs = () => {
    const ics = buildIcs(reservation);
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `the-twenty-fifth-${reservation.referenceNo}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-12 sm:py-20">
      <div className="container-tight">
        <FadeUpSection className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="h-7 w-7" />
          </div>
          <p className="eyebrow mt-5">Booking received</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            We&rsquo;ve got your request.
          </h1>

          {/* Reference number */}
          <div className="mx-auto mt-8 max-w-xl rounded-xl border border-border bg-card p-6 shadow-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Your reference number
            </p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              {reservation.referenceNo}
            </p>
            <div className="mt-4 flex justify-center">
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
            <p className="mt-4 text-sm text-muted-foreground">
              {statusConfig.description}
            </p>
          </div>

          <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">
            Save your reference number — you&rsquo;ll use it to look up your
            booking later. We&rsquo;ll also email it to{" "}
            <span className="font-medium text-foreground">
              {reservation.guest?.email}
            </span>
            .
          </p>
        </FadeUpSection>

        {/* What happens next */}
        <FadeUpSection delay={0.1} className="mx-auto mt-12 max-w-2xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            What happens next
          </h2>
          <ol className="mt-5 space-y-4">
            {[
              {
                title: "We review your request",
                body: "We check the dates and availability, usually within a few hours.",
              },
              {
                title: "We confirm by phone or Messenger",
                body: "We'll reach out to lock in your dates and arrange the deposit.",
              },
              {
                title: "See you at the beach!",
                body: `Check-in from 2:00 PM at ${RESORT_INFO.addressShort}.`,
              },
            ].map((step, i) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-card"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </FadeUpSection>

        {/* Action buttons */}
        <FadeUpSection delay={0.15} className="mx-auto mt-10 max-w-2xl">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:flex-row md:flex-wrap md:justify-center">
            <Button
              onClick={downloadIcs}
              variant="outline"
              className="w-full rounded-full md:w-auto"
            >
              <Download className="h-4 w-4" />
              Add to Calendar
            </Button>
            <a
              href={RESORT_INFO.social.messenger}
              target="_blank"
              rel="noopener noreferrer"
              className="md:w-auto"
            >
              <Button className="w-full rounded-full md:w-auto">
                <MessageSquare className="h-4 w-4" />
                Message us on Messenger
              </Button>
            </a>
            <a href={`tel:${RESORT_INFO.phoneRaw}`} className="md:w-auto">
              <Button
                variant="outline"
                className="w-full rounded-full md:w-auto"
              >
                <Phone className="h-4 w-4" />
                Call the villa
              </Button>
            </a>
            <Button
              onClick={() => navigate("find-reservation")}
              variant="outline"
              className="w-full rounded-full md:w-auto"
            >
              <Search className="h-4 w-4" />
              Find my booking later
            </Button>
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={onReset}
              variant="ghost"
              className="rounded-full text-muted-foreground"
            >
              <Home className="h-4 w-4" />
              Back to home
            </Button>
          </div>
        </FadeUpSection>
      </div>
    </div>
  );
}

// ============================================================
// Shared small components
// ============================================================
function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {hint && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            aria-label={`Decrease ${label}`}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-display text-lg font-semibold tabular-nums">
            {value}
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            aria-label={`Increase ${label}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileStickyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur sm:hidden">
      {children}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2 space-y-1.5 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function defaultDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function buildIcs(reservation: Reservation): string {
  const dt = (s: string) => {
    const d = new Date(s);
    // All-day event: check-out day is exclusive.
    return (
      d.getUTCFullYear() +
      String(d.getUTCMonth() + 1).padStart(2, "0") +
      String(d.getUTCDate()).padStart(2, "0")
    );
  };
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Twenty-Fifth//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${reservation.referenceNo}@the25thinzambales.com`,
    `DTSTAMP:${dt(new Date().toISOString())}T000000Z`,
    `DTSTART;VALUE=DATE:${dt(reservation.checkIn)}`,
    `DTEND;VALUE=DATE:${dt(reservation.checkOut)}`,
    `SUMMARY:Stay at The Twenty-Fifth`,
    `LOCATION:${RESORT_INFO.address}`,
    `DESCRIPTION:Reference: ${reservation.referenceNo}\\nGuests: ${reservation.adults + reservation.children}\\nStatus: ${reservation.status}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
