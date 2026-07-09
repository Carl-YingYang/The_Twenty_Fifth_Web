"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================
// Concierge chat store
// Keeps Mara's conversation alive across SPA view-switches.
// Persisted to localStorage so a refresh keeps the thread too.
// ============================================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  error?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  open: boolean;
  hasWelcomed: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  push: (msg: ChatMessage) => void;
  appendToLast: (delta: string) => void;
  markLastError: (message: string) => void;
  reset: () => void;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      open: false,
      hasWelcomed: false,
      setOpen: (open) => set({ open }),
      toggle: () => set({ open: !get().open }),
      push: (msg) =>
        set((s) => ({ messages: [...s.messages, msg], hasWelcomed: true })),
      appendToLast: (delta) =>
        set((s) => {
          if (s.messages.length === 0) return s;
          const last = s.messages[s.messages.length - 1];
          if (last.role !== "assistant") return s;
          const updated: ChatMessage = { ...last, content: last.content + delta };
          return { messages: [...s.messages.slice(0, -1), updated] };
        }),
      markLastError: (message) =>
        set((s) => {
          if (s.messages.length === 0) return s;
          const last = s.messages[s.messages.length - 1];
          const updated: ChatMessage = {
            ...last,
            content: message,
            error: true,
          };
          return { messages: [...s.messages.slice(0, -1), updated] };
        }),
      reset: () => set({ messages: [], hasWelcomed: false }),
    }),
    {
      name: "mara-concierge",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        messages: s.messages,
        hasWelcomed: s.hasWelcomed,
      }),
    }
  )
);

export { uid as chatUid };
