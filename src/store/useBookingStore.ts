"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BookingDraft {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  selectedRoomId: string | null;
}

interface BookingState extends BookingDraft {
  setSearch: (patch: Partial<BookingDraft>) => void;
  selectRoom: (roomId: string) => void;
  reset: () => void;
}

const initial: BookingDraft = {
  checkIn: "",
  checkOut: "",
  adults: 2,
  children: 0,
  selectedRoomId: null,
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      ...initial,
      setSearch: (patch) => set((state) => ({ ...state, ...patch })),
      selectRoom: (roomId) => set({ selectedRoomId: roomId }),
      reset: () => set(initial),
    }),
    { name: "rrms-booking" }
  )
);
