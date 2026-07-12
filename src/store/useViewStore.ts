"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { View } from "@/types";

interface ViewState {
  view: View;
  params: Record<string, string>;
  // navigate to a view with optional params (e.g. roomId)
  navigate: (view: View, params?: Record<string, string>) => void;
  // Read ?view=... from the URL on initial mount and switch to it if valid.
  // P0 security: the only way to reach the admin-login screen is now by
  // typing ?view=admin-login in the URL — the button was removed from the
  // public footer to avoid advertising the admin surface to guests.
  initFromUrl: () => void;
  reset: () => void;
}

// Allow-list of views that may be set directly via ?view= URL param.
// Anything not in this list is silently ignored (defensive — prevents
// an attacker from forcing an arbitrary view string into the store).
const ALLOWED_VIEWS: View[] = [
  "home",
  "about",
  "rooms",
  "room-details",
  "amenities",
  "gallery",
  "faqs",
  "contact",
  "book",
  "booking-confirmation",
  "find-reservation",
  "admin-login",
  "admin-dashboard",
  "admin-bookings",
  "admin-rooms",
  "admin-guests",
  "admin-calendar",
  "admin-reports",
  "admin-amenities",
  "admin-gallery",
  "admin-settings",
  "admin-profile",
];

export const useViewStore = create<ViewState>()(
  persist(
    (set, get) => ({
      view: "home",
      params: {},
      navigate: (view, params = {}) => {
        set({ view, params });
        // scroll to top on view change
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        }
      },
      initFromUrl: () => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const requested = params.get("view") as View | null;
        if (requested && ALLOWED_VIEWS.includes(requested)) {
          // Only honor the URL param if the user explicitly typed it —
          // this gives admins a discreet way in (?view=admin-login) without
          // surfacing a button to casual resort guests.
          set({ view: requested });
        }
      },
      reset: () => set({ view: "home", params: {} }),
    }),
    {
      name: "rrms-view",
      // Skip auto-hydration to avoid SSR/client mismatch (blank screen on mobile).
      // We rehydrate manually after mount in the root page.
      skipHydration: true,
      // Only persist view for convenience (so refresh keeps you on same page)
      partialize: (state) => ({ view: state.view, params: state.params }),
    }
  )
);
