"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  X,
  Send,
  ShieldCheck,
  ShieldAlert,
  Check,
  XCircle,
  Loader2,
  Sparkles,
  CalendarClock,
  LogIn,
  LogOut,
  Trash2,
  Bell,
  StickyNote,
  LayoutList,
  type LucideIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { apiFetch, authHeaders } from "@/lib/api-client";
import {
  useAdminChatStore,
  adminChatUid,
  type AdminChatMessage,
  type CopilotAction,
} from "@/store/useAdminChatStore";
import { Button } from "@/components/ui/button";

// ============================================================
// Aria — Admin Operations Copilot
//
// A controlled AI assistant for the admin dashboard. Aria answers
// questions about live operations AND can propose automation
// actions (confirm bookings, check guests in, set room status…).
// Every write action renders as an approval card — nothing executes
// until the admin clicks "Approve". All executions are audit-logged
// server-side.
//
// Responsive: full-screen sheet on mobile, floating panel on
// desktop. Streams replies from /api/admin/chat (Groq → z-ai).
// ============================================================

const QUICK_REPLIES: { label: string; text: string; icon: LucideIcon }[] = [
  { label: "Today's arrivals", text: "Who's checking in today?", icon: LogIn },
  { label: "Pending bookings", text: "Show me all pending reservations.", icon: LayoutList },
  { label: "Occupancy", text: "What's our current occupancy and room status?", icon: Sparkles },
  { label: "Today's check-outs", text: "Who's checking out today?", icon: LogOut },
];

const WELCOME: AdminChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm **Aria** — your operations copilot. I can see the live dashboard (arrivals, pending bookings, occupancy, room statuses) and can propose actions for you to approve.\n\nAsk me anything, or try a quick prompt below.",
  ts: 0,
};

// Icon per tool name (for the action card header).
const TOOL_ICON: Record<string, LucideIcon> = {
  confirm_booking: ShieldCheck,
  reject_booking: XCircle,
  check_in_guest: LogIn,
  check_out_guest: LogOut,
  cancel_booking: Trash2,
  mark_no_show: CalendarClock,
  set_room_status: LayoutList,
  add_guest_note: StickyNote,
  create_notification: Bell,
};

const DESTRUCTIVE_TOOLS = new Set([
  "reject_booking",
  "cancel_booking",
  "mark_no_show",
]);

export function AdminCopilot() {
  const {
    open,
    setOpen,
    toggle,
    messages,
    push,
    appendToLast,
    finalizeLast,
    markLastError,
    updateAction,
    reset,
    hasWelcomed,
  } = useAdminChatStore();
  const qc = useQueryClient();

  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new content.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, open, streaming]);

  // ESC to close.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Focus on open.
  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Abort on unmount.
  React.useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const userMsg: AdminChatMessage = {
        id: adminChatUid(),
        role: "user",
        content: trimmed,
        ts: Date.now(),
      };
      push(userMsg);
      setInput("");

      const assistantId = adminChatUid();
      push({ id: assistantId, role: "assistant", content: "", ts: Date.now() });

      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      const history = useAdminChatStore
        .getState()
        .messages.filter((m) => m.id !== assistantId && !m.error)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/admin/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let friendly = "I couldn't get a reply just then. Please try again.";
          try {
            const j = await res.json();
            if (j?.error) friendly = j.error;
          } catch {
            // ignore
          }
          markLastError(friendly);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let sawContent = false;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const evt of events) {
            const line = evt.split("\n").find((l) => l.trim().startsWith("data:"));
            if (!line) continue;
            const data = line.trim().slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (typeof parsed.content === "string" && parsed.content.length > 0) {
                appendToLast(parsed.content);
                sawContent = true;
              } else if (parsed.error) {
                markLastError(parsed.error);
                return;
              }
            } catch {
              // ignore malformed chunk
            }
          }
        }

        if (!sawContent) {
          markLastError("I didn't catch a response that time. Please try again.");
          return;
        }

        // ---- After streaming: extract any aria-action proposals ----
        const finalMsg = useAdminChatStore.getState().messages.find(
          (m) => m.id === assistantId
        );
        if (finalMsg) {
          const { cleanContent, actions } = extractActions(finalMsg.content);
          finalizeLast(cleanContent, actions);
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        markLastError("Something went wrong reaching the copilot. Please try again.");
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, push, appendToLast, finalizeLast, markLastError]
  );

  const handleQuickReply = (text: string) => send(text);

  // ---- Approve / reject an action ----
  const approveAction = React.useCallback(
    async (msgId: string, action: CopilotAction) => {
      updateAction(action.id, {
        status: "executing",
        approvedAt: Date.now(),
      });

      try {
        const result = await apiFetch<{
          ok: boolean;
          message: string;
          data: Record<string, unknown> | null;
          tool: string;
        }>("/api/admin/chat/execute", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ tool: action.tool, args: action.args }),
        });

        updateAction(action.id, {
          status: result.ok ? "done" : "error",
          resultMessage: result.message,
          resultData: result.data,
          executedAt: Date.now(),
        });

        if (result.ok) {
          toast.success(result.message);
          // Refresh admin data caches so the UI reflects the change.
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          qc.invalidateQueries({ queryKey: ["reservations"] });
          qc.invalidateQueries({ queryKey: ["rooms"] });
          qc.invalidateQueries({ queryKey: ["guests"] });
          qc.invalidateQueries({ queryKey: ["notifications"] });
          qc.invalidateQueries({ queryKey: ["calendar"] });
        } else {
          toast.error(result.message);
        }
      } catch (err) {
        const msg =
          (err as { message?: string })?.message ||
          "The action failed to execute. Please try again or do it manually.";
        updateAction(action.id, {
          status: "error",
          resultMessage: msg,
          executedAt: Date.now(),
        });
        toast.error(msg);
      }
    },
    [updateAction, qc]
  );

  const rejectAction = React.useCallback(
    (action: CopilotAction) => {
      updateAction(action.id, { status: "rejected" });
    },
    [updateAction]
  );

  const visibleMessages = messages.length > 0 ? messages : hasWelcomed ? messages : [];
  const isEmpty = visibleMessages.length === 0;

  return (
    <>
      {/* Floating action button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="aria-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            onClick={toggle}
            aria-label="Open Aria, the operations copilot"
            className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sidebar text-white shadow-lg shadow-sidebar/40 ring-1 ring-white/10 transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
          >
            <Bot className="relative h-[1.35rem] w-[1.35rem]" strokeWidth={1.75} />
            <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
            <span className="pointer-events-none absolute right-14 hidden whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 lg:block">
              Aria · Operations Copilot
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="aria-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] sm:hidden"
              aria-hidden="true"
            />

            <motion.div
              key="aria-panel"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              role="dialog"
              aria-label="Aria operations copilot"
              className={cn(
                "fixed z-50 flex flex-col overflow-hidden border border-border bg-card shadow-2xl",
                "inset-x-0 bottom-0 top-0 rounded-none",
                "sm:inset-x-auto sm:bottom-5 sm:right-5 sm:top-auto sm:h-[min(660px,calc(100dvh-2.5rem))] sm:w-[400px] sm:rounded-xl",
                "lg:bottom-6 lg:right-6 lg:w-[440px]"
              )}
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              {/* Header — deep forest admin theme */}
              <div className="flex items-center gap-3 bg-sidebar px-4 py-3 text-white">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                  <Bot className="h-[1.05rem] w-[1.05rem] text-white" strokeWidth={1.75} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display text-[0.95rem] font-semibold leading-tight text-white">
                      Aria
                    </p>
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white/70">
                      Copilot
                    </span>
                  </div>
                  <p className="truncate text-[0.7rem] text-white/60">
                    Operations · actions need your approval
                  </p>
                </div>
                {messages.length > 0 && (
                  <button
                    onClick={() => {
                      reset();
                    }}
                    aria-label="Clear conversation"
                    title="Clear conversation"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Trash2 className="h-[0.95rem] w-[0.95rem]" strokeWidth={2} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close copilot"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} />
                </button>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 space-y-2.5 overflow-y-auto bg-section/40 px-3.5 py-4 sm:px-4"
              >
                {isEmpty && (
                  <>
                    <MessageBubble msg={WELCOME} />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {QUICK_REPLIES.map((q) => {
                        const Icon = q.icon;
                        return (
                          <button
                            key={q.label}
                            onClick={() => handleQuickReply(q.text)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                          >
                            <Icon className="h-3 w-3 shrink-0" />
                            {q.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {visibleMessages.map((m, i) => {
                  const isLastAssistant =
                    m.role === "assistant" && i === visibleMessages.length - 1;
                  return (
                    <MessageBubble
                      key={m.id}
                      msg={m}
                      streaming={isLastAssistant && streaming}
                      onApprove={approveAction}
                      onReject={rejectAction}
                    />
                  );
                })}

                {streaming &&
                  visibleMessages[visibleMessages.length - 1]?.role === "assistant" &&
                  visibleMessages[visibleMessages.length - 1]?.content === "" && (
                    <TypingIndicator />
                  )}
              </div>

              {/* Input */}
              <div className="border-t border-border bg-card px-3 py-2.5 sm:px-3.5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    rows={1}
                    placeholder="Ask Aria… e.g. 'Confirm TTF-2026-123456'"
                    disabled={streaming}
                    aria-label="Message Aria"
                    className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || streaming}
                    aria-label="Send message"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar text-white transition-all hover:bg-sidebar/90 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Send className="h-4 w-4" strokeWidth={2} />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ------------------------------------------------------------
// Parse aria-action fenced blocks out of streamed content.
// ------------------------------------------------------------
function extractActions(raw: string): {
  cleanContent: string;
  actions: CopilotAction[];
} {
  const actions: CopilotAction[] = [];
  let clean = raw;

  const re = /```aria-action\s*\n([\s\S]*?)(?:```|$)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    const jsonText = match[1].trim();
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed && typeof parsed.tool === "string") {
        const args: Record<string, string> = {};
        if (parsed.args && typeof parsed.args === "object") {
          for (const [k, v] of Object.entries(parsed.args)) {
            if (v !== null && v !== undefined) args[k] = String(v);
          }
        }
        actions.push({
          id: adminChatUid(),
          tool: parsed.tool,
          args,
          why: typeof parsed.why === "string" ? parsed.why : undefined,
          status: "pending",
        });
      }
    } catch {
      // If the JSON is malformed, drop the block silently.
    }
  }

  clean = raw.replace(re, "").replace(/\n{3,}/g, "\n\n").trim();

  return { cleanContent: clean, actions };
}

// ------------------------------------------------------------
// Message bubble
// ------------------------------------------------------------
function MessageBubble({
  msg,
  streaming,
  onApprove,
  onReject,
}: {
  msg: AdminChatMessage;
  streaming?: boolean;
  onApprove?: (msgId: string, action: CopilotAction) => void;
  onReject?: (action: CopilotAction) => void;
}) {
  const isUser = msg.role === "user";
  const isError = msg.error;
  const hasContent = msg.content.length > 0;
  const hasActions = msg.actions && msg.actions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("max-w-[90%] sm:max-w-[88%]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-2xl rounded-br-md bg-sidebar text-white"
              : isError
              ? "rounded-2xl rounded-bl-md border border-destructive/25 bg-destructive/5 text-destructive"
              : "rounded-2xl rounded-bl-md border border-border bg-card text-card-foreground"
          )}
        >
          {hasContent ? (
            <div className="chat-markdown">
              <ReactMarkdown
                components={{
                  a: ({ node: _node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline underline-offset-2"
                    />
                  ),
                  ul: ({ node: _node, ...props }) => (
                    <ul {...props} className="my-1 list-disc space-y-0.5 pl-4" />
                  ),
                  ol: ({ node: _node, ...props }) => (
                    <ol {...props} className="my-1 list-decimal space-y-0.5 pl-4" />
                  ),
                  p: ({ node: _node, ...props }) => (
                    <p
                      {...props}
                      className={cn(
                        "m-0",
                        streaming &&
                          "after:ml-0.5 after:inline-block after:animate-pulse after:content-['▋']"
                      )}
                    />
                  ),
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          ) : streaming ? null : (
            <span className="text-muted-foreground">(empty)</span>
          )}
        </div>

        {/* Action cards */}
        {hasActions && (
          <div className="mt-2 space-y-2">
            {msg.actions!.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onApprove={onApprove ? () => onApprove(msg.id, action) : undefined}
                onReject={onReject ? () => onReject(action) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------
// Action card — the human-in-the-loop approval surface
// ------------------------------------------------------------
function ActionCard({
  action,
  onApprove,
  onReject,
}: {
  action: CopilotAction;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const Icon = TOOL_ICON[action.tool] ?? Sparkles;
  const destructive = DESTRUCTIVE_TOOLS.has(action.tool);
  const label = prettyToolLabel(action.tool);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        destructive ? "border-amber-300/70 ring-1 ring-amber-200/50" : "border-primary/30",
        action.status === "done" && "border-emerald-300/70",
        action.status === "error" && "border-destructive/40",
        action.status === "rejected" && "border-muted opacity-70"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-xs font-semibold",
          destructive
            ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            : "bg-primary/5 text-primary"
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 truncate">{label}</span>
        {destructive && action.status === "pending" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/70 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-amber-900">
            <ShieldAlert className="h-2.5 w-2.5" />
            Destructive
          </span>
        )}
        <StatusBadge status={action.status} />
      </div>

      {/* Body — args preview */}
      <div className="space-y-2 px-3 py-2.5">
        {action.why && (
          <p className="text-xs italic text-muted-foreground">&ldquo;{action.why}&rdquo;</p>
        )}
        <div className="space-y-1">
          {Object.entries(action.args).map(([k, v]) => (
            <div key={k} className="flex gap-2 text-xs">
              <span className="min-w-[5.5rem] shrink-0 font-medium text-muted-foreground">
                {prettyArgLabel(k)}:
              </span>
              <span className="min-w-0 flex-1 break-words font-mono text-foreground">
                {v}
              </span>
            </div>
          ))}
        </div>

        {/* Result message (done / error) */}
        {action.resultMessage && (
          <div
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs",
              action.status === "done"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {action.resultMessage}
          </div>
        )}
      </div>

      {/* Actions (only when pending) */}
      {action.status === "pending" && (
        <div className="flex gap-2 border-t border-border bg-muted/30 px-3 py-2">
          {onApprove && (
            <Button
              size="sm"
              onClick={onApprove}
              className="h-8 flex-1 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check className="h-3.5 w-3.5" />
              Approve &amp; run
            </Button>
          )}
          {onReject && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              className="h-8 gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Dismiss
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CopilotAction["status"] }) {
  const map: Record<
    CopilotAction["status"],
    { label: string; cls: string; icon?: LucideIcon }
  > = {
    pending: { label: "Awaiting", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" },
    approved: { label: "Approved", cls: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200" },
    executing: { label: "Running", cls: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200", icon: Loader2 },
    done: { label: "Done", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200", icon: Check },
    rejected: { label: "Dismissed", cls: "bg-muted text-muted-foreground", icon: X },
    error: { label: "Failed", cls: "bg-destructive/15 text-destructive", icon: XCircle },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide",
        cfg.cls
      )}
    >
      {Icon && <Icon className={cn("h-2.5 w-2.5", status === "executing" && "animate-spin")} />}
      {cfg.label}
    </span>
  );
}

function prettyToolLabel(tool: string): string {
  const map: Record<string, string> = {
    confirm_booking: "Confirm booking",
    reject_booking: "Reject booking",
    check_in_guest: "Check-in guest",
    check_out_guest: "Check-out guest",
    cancel_booking: "Cancel booking",
    mark_no_show: "Mark no-show",
    set_room_status: "Update room status",
    add_guest_note: "Add guest note",
    create_notification: "Post team alert",
  };
  return map[tool] ?? tool;
}

function prettyArgLabel(key: string): string {
  const map: Record<string, string> = {
    referenceNo: "Reference",
    reason: "Reason",
    roomNumber: "Room",
    status: "Status",
    guestEmail: "Email",
    note: "Note",
    title: "Title",
    message: "Message",
  };
  return map[key] ?? key;
}

// ------------------------------------------------------------
// Typing indicator
// ------------------------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.14,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default AdminCopilot;
