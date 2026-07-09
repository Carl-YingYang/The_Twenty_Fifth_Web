"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ConciergeBell,
  X,
  Send,
  CalendarCheck,
  Phone,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RESORT_INFO } from "@/lib/constants";
import { useChatStore, chatUid, type ChatMessage } from "@/store/useChatStore";
import { useViewStore } from "@/store/useViewStore";

// ============================================================
// Mara — The Twenty-Fifth's digital concierge
// Clean, sharp, responsive floating chat widget.
// Streams replies from /api/chat (Groq primary, z-ai fallback).
// ============================================================

const QUICK_REPLIES: { label: string; text: string; icon: LucideIcon }[] = [
  { label: "How do I book?", text: "How do I book a stay?", icon: CalendarCheck },
  {
    label: "Room options & prices",
    text: "What room configurations do you have and how much are they?",
    icon: Sparkles,
  },
  {
    label: "Check-in times",
    text: "What are the check-in and check-out times?",
    icon: ConciergeBell,
  },
  {
    label: "Whole villa price",
    text: "How much is the whole villa per night?",
    icon: Sparkles,
  },
];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm **Mara** — your concierge at The Twenty-Fifth. 🌊\n\nI can help you pick the right room, walk you through booking, or answer anything about the villa. How can I help?",
  ts: 0,
};

export function ConciergeChat() {
  const { open, setOpen, toggle, messages, push, appendToLast, markLastError, hasWelcomed } =
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
      const t = setTimeout(() => inputRef.current?.focus(), 200);
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

  const visibleMessages =
    messages.length > 0 ? messages : hasWelcomed ? messages : [];

  const isEmpty = visibleMessages.length === 0;

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
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            onClick={toggle}
            aria-label="Chat with Mara, our concierge"
            className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
          >
            <ConciergeBell className="relative h-[1.35rem] w-[1.35rem]" strokeWidth={1.75} />
            {/* Online dot */}
            <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
            {/* Tooltip */}
            <span className="pointer-events-none absolute right-14 hidden whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 lg:block">
              Chat with Mara
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel — responsive */}
      <AnimatePresence>
        {open && (
          <>
            {/* Mobile backdrop (subtle, only < sm) */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] sm:hidden"
              aria-hidden="true"
            />

            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              role="dialog"
              aria-label="Concierge chat with Mara"
              className={cn(
                "fixed z-50 flex flex-col overflow-hidden border border-border bg-card shadow-2xl",
                // Mobile: full-screen sheet anchored to bottom
                "inset-x-0 bottom-0 top-0 rounded-none",
                // sm+: floating panel, bottom-right
                "sm:inset-x-auto sm:bottom-5 sm:right-5 sm:top-auto sm:h-[min(620px,calc(100dvh-2.5rem))] sm:w-[380px] sm:rounded-xl",
                // lg+: slightly more breathing room
                "lg:bottom-6 lg:right-6 lg:w-[400px]"
              )}
              style={{
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }}
            >
              {/* Header — clean white */}
              <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <ConciergeBell className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.75} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display text-[0.95rem] font-semibold leading-tight text-foreground">
                      Mara
                    </p>
                    <span className="text-[0.7rem] font-medium text-emerald-600">· Online</span>
                  </div>
                  <p className="truncate text-[0.7rem] text-muted-foreground">
                    Concierge · replies in seconds
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} />
                </button>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 space-y-2.5 overflow-y-auto bg-section/40 px-3.5 py-4 sm:px-4"
              >
                {/* Welcome + quick replies (only when no messages yet) */}
                {isEmpty && (
                  <>
                    <MessageBubble
                      msg={WELCOME}
                      onStartBooking={handleStartBooking}
                    />
                    <div className="flex flex-wrap gap-1.5 pl-0 pt-1">
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

              {/* Input — minimal, single row */}
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
                    placeholder="Ask Mara anything…"
                    disabled={streaming}
                    aria-label="Message"
                    className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || streaming}
                    aria-label="Send message"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-30"
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
// Message bubble — sharp, clean, no per-message avatars
// ------------------------------------------------------------
function MessageBubble({
  msg,
  streaming,
  onStartBooking,
}: {
  msg: ChatMessage;
  streaming?: boolean;
  onStartBooking?: () => void;
}) {
  const isUser = msg.role === "user";
  const isError = msg.error;
  const hasContent = msg.content.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("max-w-[88%] sm:max-w-[85%]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground"
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

        {/* Inline "Start booking" CTA — only on the latest assistant reply
            (or the welcome message), never on historical messages. */}
        {!isUser && hasContent && !streaming && !isError && onStartBooking && (
          <button
            onClick={onStartBooking}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            Start booking
          </button>
        )}

        {/* Error retry / contact fallback */}
        {isError && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <a
              href={RESORT_INFO.social.messenger}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Message us
            </a>
            <a
              href={`tel:${RESORT_INFO.phoneRaw}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------
// Typing indicator (three bouncing dots, no avatar)
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
