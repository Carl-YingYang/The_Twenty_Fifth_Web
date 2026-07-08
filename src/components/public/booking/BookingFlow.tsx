"use client";

import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  Loader2,
  PartyPopper,
  Search,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { guestInfoSchema, type GuestInfoInput } from "@/lib/validators";
import type { AvailableRoom, Reservation } from "@/types";
import { RoomCard } from "../RoomCard";

interface AvailabilityResponse {
  available: AvailableRoom[];
  unavailable: AvailableRoom[];
  nights: number;
}
interface ReservationResponse {
  reservation: Reservation;
}

const STEPS = [
  { id: 1, label: "Dates", short: "Search" },
  { id: 2, label: "Room", short: "Select" },
  { id: 3, label: "Guest", short: "Details" },
  { id: 4, label: "Review", short: "Confirm" },
  { id: 5, label: "Done", short: "Confirmed" },
];

function defaultDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export function BookingFlow() {
  const navigate = useViewStore((s) => s.navigate);
  const params = useViewStore((s) => s.params);
  const booking = useBookingStore();
  const setSearch = useBookingStore((s) => s.setSearch);
  const selectRoom = useBookingStore((s) => s.selectRoom);
  const resetBooking = useBookingStore((s) => s.reset);

  const [step, setStep] = React.useState(1);
  const [checkIn, setCheckIn] = React.useState(booking.checkIn || defaultDate(1));
  const [checkOut, setCheckOut] = React.useState(booking.checkOut || defaultDate(3));
  const [adults, setAdults] = React.useState(String(booking.adults || 2));
  const [children, setChildren] = React.useState(String(booking.children || 0));
  const [selectedRoomId, setSelectedRoomId] = React.useState<string | null>(
    booking.selectedRoomId || params.roomId || null
  );
  const [guestInfo, setGuestInfo] = React.useState<GuestInfoInput | null>(null);
  const [confirmedReservation, setConfirmedReservation] = React.useState<Reservation | null>(null);

  const nights = nightsBetween(checkIn, checkOut);

  // Availability query (only triggered on step 2)
  const availabilityQuery = useQuery({
    queryKey: ["availability", "booking", checkIn, checkOut, adults, children],
    queryFn: () =>
      apiFetch<AvailabilityResponse>(
        `/api/rooms/availability?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`
      ),
    enabled: step === 2 && !!checkIn && !!checkOut && new Date(checkOut) > new Date(checkIn),
  });

  const selectedRoom =
    availabilityQuery.data?.available.find((r) => r.id === selectedRoomId) ??
    availabilityQuery.data?.unavailable.find((r) => r.id === selectedRoomId) ??
    null;

  // Create reservation mutation
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
      setConfirmedReservation(data.reservation);
      setStep(5);
      toast.success("Reservation created!", {
        description: `Reference ${data.reservation.referenceNo}`,
      });
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : "Failed to create reservation";
      toast.error(message);
      setStep(4);
    },
  });

  // ---- Step handlers ----

  const onSearchAvailability = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select your check-in and check-out dates");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      toast.error("Check-out must be after check-in");
      return;
    }
    setSearch({
      checkIn,
      checkOut,
      adults: parseInt(adults, 10),
      children: parseInt(children, 10),
    });
    setStep(2);
  };

  const onSelectRoom = (room: AvailableRoom) => {
    if (!room.isAvailable) {
      toast.error("This room is not available for the selected dates");
      return;
    }
    setSelectedRoomId(room.id);
    selectRoom(room.id);
    setStep(3);
  };

  const onGuestInfoSubmit = (values: GuestInfoInput) => {
    setGuestInfo(values);
    setStep(4);
  };

  const onConfirmReservation = () => {
    if (!selectedRoomId || !guestInfo) {
      toast.error("Missing reservation details");
      return;
    }
    setStep(5); // show loading state
    createMutation.mutate({
      roomId: selectedRoomId,
      checkIn,
      checkOut,
      adults: parseInt(adults, 10),
      children: parseInt(children, 10),
      guest: guestInfo,
      specialRequests: guestInfo.specialRequests,
    });
  };

  const restart = () => {
    resetBooking();
    setStep(1);
    setCheckIn(defaultDate(1));
    setCheckOut(defaultDate(3));
    setAdults("2");
    setChildren("0");
    setSelectedRoomId(null);
    setGuestInfo(null);
    setConfirmedReservation(null);
    navigate("home");
  };

  return (
    <div className="pt-16 md:pt-20">
      {/* Header */}
      <section className="border-b border-border/60 bg-section">
        <div className="container-luxury py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
                Reserve Your Stay
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Book Verdara
              </h1>
            </div>
            {step > 1 && step < 5 && (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Progress indicator */}
      {step < 5 && (
        <div className="border-b border-border/60 bg-background">
          <div className="container-luxury py-5">
            <ol className="flex items-center justify-between gap-1 overflow-x-auto">
              {STEPS.slice(0, 4).map((s, idx) => {
                const status =
                  step === s.id ? "current" : step > s.id ? "complete" : "upcoming";
                return (
                  <li key={s.id} className="flex flex-1 items-center gap-3">
                    <button
                      onClick={() => {
                        if (s.id < step) setStep(s.id);
                      }}
                      disabled={s.id >= step}
                      className="flex items-center gap-3"
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-all",
                          status === "current" && "border-primary bg-primary text-white",
                          status === "complete" && "border-primary bg-primary/10 text-primary",
                          status === "upcoming" && "border-border bg-card text-muted-foreground"
                        )}
                      >
                        {status === "complete" ? <Check className="h-4 w-4" /> : idx + 1}
                      </span>
                      <div className="hidden sm:block">
                        <div
                          className={cn(
                            "text-xs uppercase tracking-wider",
                            status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                          )}
                        >
                          Step {idx + 1}
                        </div>
                        <div
                          className={cn(
                            "text-sm font-medium",
                            status === "current" && "text-primary",
                            status === "complete" && "text-foreground",
                            status === "upcoming" && "text-muted-foreground"
                          )}
                        >
                          {s.label}
                        </div>
                      </div>
                    </button>
                    {idx < 3 && (
                      <div
                        className={cn(
                          "ml-1 h-px flex-1",
                          step > s.id ? "bg-primary" : "bg-border"
                        )}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      <section className="py-10 sm:py-14">
        <div className="container-luxury">
          <AnimatePresence mode="wait">
            {/* STEP 1: Search */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mx-auto max-w-3xl"
              >
                <Card className="rounded-2xl border-border/60 p-6 shadow-luxury sm:p-10">
                  <div className="text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CalendarIcon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
                      When would you like to stay?
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Choose your dates and party size to see available residences.
                    </p>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="bf-checkin" className="text-xs uppercase tracking-wider text-muted-foreground">
                        Check-in
                      </Label>
                      <div className="relative">
                        <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="bf-checkin"
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="rounded-xl pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bf-checkout" className="text-xs uppercase tracking-wider text-muted-foreground">
                        Check-out
                      </Label>
                      <div className="relative">
                        <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="bf-checkout"
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="rounded-xl pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Adults</Label>
                      <Select value={adults} onValueChange={setAdults}>
                        <SelectTrigger className="w-full rounded-xl">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} {n === 1 ? "Adult" : "Adults"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Children</Label>
                      <Select value={children} onValueChange={setChildren}>
                        <SelectTrigger className="w-full rounded-xl">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} {n === 1 ? "Child" : "Children"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={onSearchAvailability}
                    size="lg"
                    className="mt-8 w-full rounded-full"
                  >
                    <Search className="h-4 w-4" />
                    Search availability
                  </Button>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    No payment required to hold your reservation — our concierge will reach out
                    within 24 hours to confirm details.
                  </p>
                </Card>
              </motion.div>
            )}

            {/* STEP 2: Select Room */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-semibold tracking-tight">
                      Available residences
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(checkIn)} → {formatDate(checkOut)} · {nights} night{nights > 1 ? "s" : ""} ·{" "}
                      {parseInt(adults, 10) + parseInt(children, 10)} guest
                      {parseInt(adults, 10) + parseInt(children, 10) > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setStep(1)} className="rounded-full">
                    <CalendarIcon className="h-4 w-4" />
                    Edit dates
                  </Button>
                </div>

                {availabilityQuery.isLoading ? (
                  <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Checking availability…
                  </div>
                ) : availabilityQuery.data ? (
                  <>
                    {availabilityQuery.data.available.length === 0 ? (
                      <Card className="rounded-2xl border-dashed py-12 text-center">
                        <p className="font-medium">No residences available for these dates</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Try adjusting your dates or party size.
                        </p>
                        <Button onClick={() => setStep(1)} className="mt-4 rounded-full">
                          Edit search
                        </Button>
                      </Card>
                    ) : (
                      <>
                        <p className="mb-4 text-sm text-muted-foreground">
                          {availabilityQuery.data.available.length} residence
                          {availabilityQuery.data.available.length === 1 ? "" : "s"} available
                        </p>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {availabilityQuery.data.available.map((room) => (
                            <RoomCard
                              key={room.id}
                              room={room}
                              nights={nights}
                              totalPrice={room.totalPrice}
                              isAvailable
                              selected={room.id === selectedRoomId}
                              showBookButton={false}
                              showSelectButton
                              onSelect={(r) => onSelectRoom(r as AvailableRoom)}
                              onDetails={(r) =>
                                navigate("room-details", { roomId: r.id })
                              }
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {availabilityQuery.data.unavailable.length > 0 && (
                      <div className="mt-12">
                        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                          Currently unavailable
                        </h3>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {availabilityQuery.data.unavailable.slice(0, 6).map((room) => (
                            <RoomCard
                              key={room.id}
                              room={room}
                              nights={nights}
                              totalPrice={room.totalPrice}
                              isAvailable={false}
                              showBookButton={false}
                              showSelectButton
                              onSelect={() =>
                                toast.error("This room is unavailable for your dates")
                              }
                              onDetails={(r) =>
                                navigate("room-details", { roomId: r.id })
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </motion.div>
            )}

            {/* STEP 3: Guest Information */}
            {step === 3 && (
              <GuestInfoStep
                key="step3"
                defaultValues={guestInfo}
                onSubmit={onGuestInfoSubmit}
                onBack={() => setStep(2)}
              />
            )}

            {/* STEP 4: Review & Confirm */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mx-auto max-w-4xl"
              >
                <ReviewStep
                  checkIn={checkIn}
                  checkOut={checkOut}
                  adults={parseInt(adults, 10)}
                  childCount={parseInt(children, 10)}
                  nights={nights}
                  room={selectedRoom}
                  guest={guestInfo}
                  onBack={() => setStep(3)}
                  onConfirm={onConfirmReservation}
                  submitting={createMutation.isPending}
                />
              </motion.div>
            )}

            {/* STEP 5: Confirmation */}
            {step === 5 && (
              <ConfirmationStep
                reservation={confirmedReservation}
                onCreateAnother={restart}
              />
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// Step 3: Guest Info Form
// ============================================================
function GuestInfoStep({
  defaultValues,
  onSubmit,
  onBack,
}: {
  defaultValues: GuestInfoInput | null;
  onSubmit: (values: GuestInfoInput) => void;
  onBack: () => void;
}) {
  const form = useForm<GuestInfoInput>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: defaultValues ?? {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      specialRequests: "",
    },
    mode: "onBlur",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-3xl"
    >
      <Card className="rounded-2xl border-border/60 p-6 shadow-luxury sm:p-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Guest details
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll use these details to prepare your reservation and reach out to confirm.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Eleanor"
                        className="rounded-xl"
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
                        placeholder="Whitfield"
                        className="rounded-xl"
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
                        className="rounded-xl"
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
                        placeholder="+63 917 555 0101"
                        className="rounded-xl"
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Street, building, unit"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="London" className="rounded-xl" {...field} />
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
                        placeholder="United Kingdom"
                        className="rounded-xl"
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
                      placeholder="Dietary needs, accessibility, celebration notes, early check-in preference…"
                      className="min-h-[100px] rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button type="submit" size="lg" className="rounded-full">
                Continue to review
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Step 4: Review & Confirm
// ============================================================
function ReviewStep({
  checkIn,
  checkOut,
  adults,
  childCount,
  nights,
  room,
  guest,
  onBack,
  onConfirm,
  submitting,
}: {
  checkIn: string;
  checkOut: string;
  adults: number;
  childCount: number;
  nights: number;
  room: AvailableRoom | null;
  guest: GuestInfoInput | null;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  if (!room || !guest) {
    return (
      <Card className="rounded-2xl border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Missing reservation details. Please go back.
        </p>
        <Button onClick={onBack} className="mt-4 rounded-full">
          Go back
        </Button>
      </Card>
    );
  }

  const subtotal = room.pricePerNight * nights;
  const serviceFee = subtotal * 0.05;
  const tax = subtotal * 0.12;
  const total = subtotal + serviceFee + tax;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* Left: reservation summary */}
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-2xl border-border/60 shadow-luxury">
          {room.images?.[0] && (
            <div className="aspect-[16/10] w-full overflow-hidden">
              { }
              <img
                src={room.images[0].url}
                alt={room.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center gap-2">
              {room.type && (
                <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                  {room.type.name}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">Room {room.number}</span>
            </div>
            <h3 className="mt-2 font-display text-xl font-semibold">{room.name}</h3>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Up to {room.capacity} guests
              </span>
              {room.view && <span>· {room.view} view</span>}
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 p-5 shadow-luxury">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Stay details
          </h3>
          <div className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-medium">{formatDate(checkIn)} · 3:00 PM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Check-out</span>
              <span className="font-medium">{formatDate(checkOut)} · 11:00 AM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Length of stay</span>
              <span className="font-medium">
                {nights} night{nights > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Guests</span>
              <span className="font-medium">
                {adults} adult{adults > 1 ? "s" : ""}
                {childCount > 0 ? `, ${childCount} child${childCount > 1 ? "ren" : ""}` : ""}
              </span>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 p-5 shadow-luxury">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Primary guest
          </h3>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="font-medium">
              {guest.firstName} {guest.lastName}
            </div>
            <div className="text-muted-foreground">{guest.email}</div>
            <div className="text-muted-foreground">{guest.phone}</div>
            {guest.address && (
              <div className="text-muted-foreground">
                {guest.address}
                {guest.city ? `, ${guest.city}` : ""}
                {guest.country ? `, ${guest.country}` : ""}
              </div>
            )}
            {guest.specialRequests && (
              <div className="mt-3 rounded-lg bg-section p-3 text-xs">
                <span className="font-medium">Special requests: </span>
                <span className="text-muted-foreground">{guest.specialRequests}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right: price breakdown + confirm */}
      <div>
        <div className="lg:sticky lg:top-24">
          <Card className="rounded-2xl border-border/60 p-6 shadow-luxury-lg">
            <h3 className="font-display text-lg font-semibold">Price breakdown</h3>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {formatCurrency(room.pricePerNight)} × {nights} night{nights > 1 ? "s" : ""}
                </span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Service fee (5%)</span>
                <span className="font-medium">{formatCurrency(serviceFee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Taxes (12%)</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="my-3 h-px bg-border" />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-section p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">No payment required now</p>
              <p className="mt-1">
                Your reservation will be held as Pending. Our concierge will email you within 24
                hours to confirm and arrange the 30% deposit.
              </p>
            </div>

            <Button
              onClick={onConfirm}
              size="lg"
              disabled={submitting}
              className="mt-5 w-full rounded-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating reservation…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirm reservation
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={onBack}
              className="mt-2 w-full rounded-full"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to edit details
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 5: Confirmation
// ============================================================
function ConfirmationStep({
  reservation,
  onCreateAnother,
}: {
  reservation: Reservation | null;
  onCreateAnother: () => void;
}) {
  const navigate = useViewStore((s) => s.navigate);

  if (!reservation) {
    return (
      <Card className="rounded-2xl border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Something went wrong. No reservation was found.
        </p>
        <Button onClick={onCreateAnother} className="mt-4 rounded-full">
          Start over
        </Button>
      </Card>
    );
  }

  const room = reservation.rooms?.[0]?.room;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl"
    >
      {/* Confetti-like checkmark */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
        >
          <CheckCircle2 className="h-10 w-10" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight">
            Your reservation is confirmed!
          </h2>
          <p className="mt-2 text-muted-foreground">
            We've received your booking and our concierge will reach out within 24 hours to
            finalize the details.
          </p>
        </motion.div>
      </div>

      <Card className="mt-8 overflow-hidden rounded-2xl border-border/60 shadow-luxury-lg">
        <div className="bg-[#0F2E22] p-6 text-center text-white sm:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
            Reservation reference
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            {reservation.referenceNo}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
            <PartyPopper className="h-3 w-3" />
            Save this reference to manage your booking
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Check-in</p>
              <p className="mt-1 font-medium">{formatDate(reservation.checkIn)} · 3:00 PM</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Check-out</p>
              <p className="mt-1 font-medium">{formatDate(reservation.checkOut)} · 11:00 AM</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Length of stay</p>
              <p className="mt-1 font-medium">
                {reservation.nights} night{reservation.nights > 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Guests</p>
              <p className="mt-1 font-medium">
                {reservation.adults} adult{reservation.adults > 1 ? "s" : ""}
                {reservation.children > 0
                  ? `, ${reservation.children} child${reservation.children > 1 ? "ren" : ""}`
                  : ""}
              </p>
            </div>
          </div>

          {room && (
            <div className="mt-6 rounded-xl bg-section p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{room.number}</span> · {room.type?.name}
              </div>
              <div className="mt-1 font-display text-lg font-semibold">{room.name}</div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-display text-xl font-semibold text-primary">
              {formatCurrency(reservation.totalAmount)}
            </span>
          </div>
        </div>
      </Card>

      {/* What's next */}
      <Card className="mt-6 rounded-2xl border-border/60 p-6 shadow-luxury">
        <h3 className="font-display text-lg font-semibold">What happens next?</h3>
        <ol className="mt-4 space-y-3 text-sm">
          {[
            "You'll receive a confirmation email shortly with your reservation details.",
            "Our concierge will reach out within 24 hours to confirm and arrange your deposit.",
            "Once confirmed, you'll receive a welcome letter with arrival instructions and concierge contacts.",
            "We'll be in touch a few days before your stay with a weather forecast and tailored suggestions.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          onClick={() => navigate("find-reservation")}
          className="rounded-full"
          size="lg"
        >
          <Search className="h-4 w-4" />
          Find my reservation
        </Button>
        <Button
          onClick={() => navigate("home")}
          variant="outline"
          className="rounded-full"
          size="lg"
        >
          <X className="h-4 w-4" />
          Back to home
        </Button>
      </div>
    </motion.div>
  );
}
