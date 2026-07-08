"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { View } from "@/types";

interface ViewState {
  view: View;
  params: Record<string, string>;
  // navigate to a view with optional params (e.g. roomId)
  navigate: (view: View, params?: Record<string, string>) => void;
  reset: () => void;
}

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      view: "home",
      params: {},
      navigate: (view, params = {}) => {
        set({ view, params });
        // scroll to top on view change
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
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
