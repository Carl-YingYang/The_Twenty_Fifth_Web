"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================
// Admin Copilot chat store
//
// Like the public concierge store, but each assistant message may
// carry one or more "action proposals" — structured tool calls that
// Aria suggested. Each proposal has a lifecycle:
//   pending → (approved → executing → done|error) | rejected
//
// Nothing in this store executes anything — it only tracks state.
// Execution happens via /api/admin/chat/execute when the admin
// clicks Approve.
// ============================================================

export type ActionStatus =
  | "pending" // awaiting admin decision
  | "approved" // admin clicked approve, executing
  | "executing"
  | "done"
  | "rejected"
  | "error";

export interface CopilotAction {
  id: string;
  tool: string;
  args: Record<string, string>;
  why?: string;
  status: ActionStatus;
  resultMessage?: string; // set when done/error
  resultData?: Record<string, unknown> | null;
  approvedAt?: number;
  executedAt?: number;
}

export interface AdminChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  error?: boolean;
  actions?: CopilotAction[]; // assistant-only
}

interface AdminChatState {
  messages: AdminChatMessage[];
  open: boolean;
  hasWelcomed: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  push: (msg: AdminChatMessage) => void;
  appendToLast: (delta: string) => void;
  setLastActions: (actions: CopilotAction[]) => void;
  /** Atomically replace the last assistant message's content + actions. */
  finalizeLast: (content: string, actions: CopilotAction[]) => void;
  markLastError: (message: string) => void;
  updateAction: (actionId: string, patch: Partial<CopilotAction>) => void;
  reset: () => void;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useAdminChatStore = create<AdminChatState>()(
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
          const updated: AdminChatMessage = { ...last, content: last.content + delta };
          return { messages: [...s.messages.slice(0, -1), updated] };
        }),
      setLastActions: (actions) =>
        set((s) => {
          if (s.messages.length === 0) return s;
          const last = s.messages[s.messages.length - 1];
          if (last.role !== "assistant") return s;
          const updated: AdminChatMessage = { ...last, actions };
          return { messages: [...s.messages.slice(0, -1), updated] };
        }),
      finalizeLast: (content, actions) =>
        set((s) => {
          if (s.messages.length === 0) return s;
          const last = s.messages[s.messages.length - 1];
          if (last.role !== "assistant") return s;
          const updated: AdminChatMessage = { ...last, content, actions };
          return { messages: [...s.messages.slice(0, -1), updated] };
        }),
      markLastError: (message) =>
        set((s) => {
          if (s.messages.length === 0) return s;
          const last = s.messages[s.messages.length - 1];
          const updated: AdminChatMessage = {
            ...last,
            content: message,
            error: true,
          };
          return { messages: [...s.messages.slice(0, -1), updated] };
        }),
      updateAction: (actionId, patch) =>
        set((s) => {
          const messages = s.messages.map((m) => {
            if (!m.actions) return m;
            const has = m.actions.some((a) => a.id === actionId);
            if (!has) return m;
            return {
              ...m,
              actions: m.actions.map((a) =>
                a.id === actionId ? { ...a, ...patch } : a
              ),
            };
          });
          return { messages };
        }),
      reset: () => set({ messages: [], hasWelcomed: false }),
    }),
    {
      name: "aria-admin-copilot",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        messages: s.messages,
        hasWelcomed: s.hasWelcomed,
      }),
    }
  )
);

export { uid as adminChatUid };
