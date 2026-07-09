"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ConciergeBell,
  X,
  Send,
  Sparkles,
  CalendarCheck,
  Phone,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RESORT_INFO } from "@/lib/constants";
import { useChatStore, chatUid, type ChatMessage } from "@/store/useChatStore";
import { useViewStore } from "@/store/useViewStore";

// ============================================================
// Mara — The Twenty-Fifth's digital concierge
// Floating chat widget. Streams replies from /api/chat (Groq).
// ============================================================

const QUICK_REPLIES: { label: string; text: string }[] = [
  { label: "How do I book?", text: "How do I book a stay?" },
  {
    label: "What rooms are available?",
    text: "What room configurations do you have and how much are they?",
  },
  {
    label: "Check-in times",
    text: "What are the check-in and check-out times?",
  },
  {
    label: "Whole villa price",
    text: "How much is the whole villa per night?",
  },
  { label: "Is the beach private?", text: "Is the beach private?" },
  { label: "Host an event", text: "Can I host a birthday or event at the villa?" },
];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm **Mara** — your concierge at The Twenty-Fifth. 🌊\n\nI can help you pick the right room, walk you through booking, or answer anything about the villa. What brings you to the beach today?",
  ts: 0,
};

export function ConciergeChat() {
  const { open, setOpen, toggle, messages, push, appendToLast, markLastError, reset, hasWelcomed } =
    useChatStore();
  const navigate = useViewStore((s) => s.navigate);

  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages / streaming updates.
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

  // Focus input when opening.
  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Abort any in-flight stream if the widget unmounts.
  React.useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const userMsg: ChatMessage = {
        id: chatUid(),
        role: "user",
        content: trimmed,
        ts: Date.now(),
      };
      push(userMsg);
      setInput("");

      // Placeholder assistant message we will stream into.
      const assistantId = chatUid();
      push({
        id: assistantId,
        role: "assistant",
        content: "",
        ts: Date.now(),
      });

      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      // Build the message history to send (exclude the empty placeholder).
      const history = useChatStore
        .getState()
        .messages.filter((m) => m.id !== assistantId && !m.error)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let friendly =
            "I couldn't get a reply just then. Please try again, or message us directly.";
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
          markLastError(
            "I didn't catch a response that time. Please try again — or message us directly and we'll help right away."
          );
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        markLastError(
          "Something went wrong reaching the concierge. Please try again, or message us directly."
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, push, appendToLast, markLastError]
  );

  const handleQuickReply = (text: string) => send(text);

  const handleStartBooking = () => {
    setOpen(false);
    navigate("book");
  };

  const handleReset = () => {
    abortRef.current?.abort();
    reset();
  };

  const visibleMessages =
    messages.length > 0 ? messages : hasWelcomed ? messages : [];

  return (
    <>
      {/* Floating action button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={toggle}
            aria-label="Chat with Mara, our concierge"
            className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_-6px_rgba(14,90,111,0.6)] transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-primary/40 motion-safe:animate-ping" />
            <ConciergeBell className="relative h-6 w-6" strokeWidth={1.75} />
            {/* Online dot */}
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
            </span>
            {/* Tooltip */}
            <span className="pointer-events-none absolute right-16 hidden whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block">
              Chat with Mara · concierge
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            role="dialog"
            aria-label="Concierge chat with Mara"
            className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden border border-border bg-card shadow-2xl sm:bottom-6 sm:right-6 sm:h-[600px] sm:max-h-[calc(100dvh-3rem)] sm:w-[390px] sm:rounded-2xl"
          >
            {/* Header — glassmorphism */}
            <div className="relative flex items-center gap-3 border-b border-border bg-primary/95 px-4 py-3.5 text-primary-foreground backdrop-blur-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                <ConciergeBell className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-base font-semibold leading-tight">
                    Mara
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    Online
                  </span>
                </div>
                <p className="truncate text-xs text-primary-foreground/75">
                  Concierge · The Twenty-Fifth
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleReset}
                  aria-label="Clear conversation"
                  title="Clear conversation"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-white/15 hover:text-primary-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-white/15 hover:text-primary-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-section/60 to-background px-4 py-4"
            >
              {/* Welcome message (only if no real messages yet) */}
              {visibleMessages.length === 0 && (
                <MessageBubble
                  msg={WELCOME}
                  onQuickReply={handleQuickReply}
                  onStartBooking={handleStartBooking}
                />
              )}

              {visibleMessages.map((m, i) => {
                const isLastAssistant =
                  m.role === "assistant" && i === visibleMessages.length - 1;
                return (
                  <MessageBubble
                    key={m.id}
                    msg={m}
                    streaming={isLastAssistant && streaming}
                    onQuickReply={isLastAssistant ? handleQuickReply : undefined}
                    onStartBooking={isLastAssistant ? handleStartBooking : undefined}
                  />
                );
              })}

              {/* Typing indicator (shown only while streaming and the last bubble is empty) */}
              {streaming &&
                visibleMessages[visibleMessages.length - 1]?.role === "assistant" &&
                visibleMessages[visibleMessages.length - 1]?.content === "" && (
                  <TypingIndicator />
                )}
            </div>

            {/* Quick replies row (when idle) */}
            {!streaming && (
              <div className="border-t border-border bg-card/80 px-3 pt-2.5">
                <div className="flex gap-1.5 overflow-x-auto pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => handleQuickReply(q.text)}
                      className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border bg-card p-3">
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
                  placeholder="Ask Mara anything…"
                  disabled={streaming}
                  aria-label="Message"
                  className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || streaming}
                  aria-label="Send message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-1.5 text-center text-[0.65rem] text-muted-foreground/70">
                Mara can help with booking — for confirmed reservations, use{" "}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("find-reservation");
                  }}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Find My Booking
                </button>
                .
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ------------------------------------------------------------
// Message bubble
// ------------------------------------------------------------
function MessageBubble({
  msg,
  streaming,
  onQuickReply,
  onStartBooking,
}: {
  msg: ChatMessage;
  streaming?: boolean;
  onQuickReply?: (text: string) => void;
  onStartBooking?: () => void;
}) {
  const isUser = msg.role === "user";
  const isError = msg.error;
  const hasContent = msg.content.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-sm",
            isError ? "bg-destructive" : "bg-primary"
          )}
        >
          {isError ? (
            <MessageSquare className="h-3.5 w-3.5" />
          ) : (
            <ConciergeBell className="h-3.5 w-3.5" />
          )}
        </div>
      )}

      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : isError
            ? "rounded-bl-md border border-destructive/30 bg-destructive/5 text-destructive"
            : "rounded-bl-md border border-border bg-card text-card-foreground"
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
                      streaming && "after:ml-0.5 after:animate-pulse after:content-['▋']"
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

        {/* Inline action chips — only on the latest assistant reply
            (or the welcome message), never on historical messages. */}
        {!isUser && hasContent && !streaming && !isError && (onStartBooking || onQuickReply) && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border/60 pt-2.5">
            {onStartBooking && (
              <button
                onClick={onStartBooking}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <CalendarCheck className="h-3 w-3" />
                Start booking
              </button>
            )}
            {onQuickReply && (
              <button
                onClick={() => onQuickReply("What's included with my stay?")}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Sparkles className="h-3 w-3" />
                What's included?
              </button>
            )}
          </div>
        )}

        {/* Error retry / contact fallback */}
        {isError && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-destructive/20 pt-2.5">
            <a
              href={RESORT_INFO.social.messenger}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
            >
              <MessageSquare className="h-3 w-3" />
              Message us
            </a>
            <a
              href={`tel:${RESORT_INFO.phoneRaw}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
            >
              <Phone className="h-3 w-3" />
              Call
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------
// Typing indicator (three bouncing dots)
// ------------------------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
        <ConciergeBell className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 shadow-sm">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
