import { NextRequest } from "next/server";
import { buildConciergeSystemPrompt } from "@/lib/chatbot-knowledge";

// ============================================================
// /api/chat — Concierge chatbot endpoint
//
// Primary provider: Groq (OpenAI-compatible). The GROQ_API_KEY
// lives only in the server environment — never sent to client.
// Fallback provider: z-ai-web-dev-sdk (works out of the box in
// this environment). If Groq returns 401/403/network error, we
// automatically fall back so the concierge always answers.
//
// Replies are streamed back to the client as a simplified SSE
// { content } event stream.
//
// NOTE: Per the owner's request, conversation length / message
// size / reply token caps have been removed so Mara can carry
// long, natural conversations without being cut off. Only basic
// structural validation remains (valid JSON, messages array,
// sane roles, last message from user).
// ============================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

// If Groq returns an auth error, skip it for this long before retrying,
// so we don't pay the failed-request latency on every message.
const GROQ_SKIP_MS = 5 * 60 * 1000;
let groqSkipUntil = 0;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function sseChunk(content: string): string {
  return `data: ${JSON.stringify({ content })}\n\n`;
}

function sseDone(): string {
  return `data: [DONE]\n\n`;
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Build a ReadableStream that emits a list of string chunks as SSE,
// optionally with a small delay between chunks (simulated streaming
// for non-streaming providers).
function streamFromChunks(chunks: string[], delayMs = 0): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(sseChunk(chunk)));
        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
      controller.enqueue(encoder.encode(sseDone()));
      controller.close();
    },
  });
}

// Split a full text into small chunks for a typing effect.
function chunkText(text: string): string[] {
  if (!text) return [];
  // Split on word boundaries but keep whitespace; ~6 words per chunk.
  const words = text.match(/\S+\s*/g) ?? [text];
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 6) {
    chunks.push(words.slice(i, i + 6).join(""));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  // Parse + validate body (structural only — no length limits).
  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const rawMessages = body.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return jsonError("No messages provided.", 400);
  }

  // Sanitize the conversation history sent by the client.
  // We accept any user/assistant turn without truncation so Mara can
  // hold long conversations. System roles from the client are dropped
  // (we inject our own system prompt server-side).
  const allowedRoles = new Set(["user", "assistant"]);
  const cleaned: ChatMessage[] = [];
  for (const m of rawMessages) {
    if (
      typeof m !== "object" ||
      m === null ||
      typeof (m as { role?: unknown }).role !== "string" ||
      typeof (m as { content?: unknown }).content !== "string"
    ) {
      continue;
    }
    const role = (m as { role: string }).role;
    const content = (m as { content: string }).content;
    if (!allowedRoles.has(role)) continue;
    if (!content.trim()) continue;
    cleaned.push({ role: role as "user" | "assistant", content });
  }

  if (cleaned.length === 0) {
    return jsonError("No valid messages provided.", 400);
  }

  // The last message must be from the user (structural sanity check).
  if (cleaned[cleaned.length - 1].role !== "user") {
    return jsonError("Last message must be from the user.", 400);
  }

  // Build the system prompt (with live room data).
  let systemPrompt: string;
  try {
    systemPrompt = await buildConciergeSystemPrompt();
  } catch {
    return jsonError(
      "I'm having trouble loading the villa details right now. Please try again in a moment.",
      500
    );
  }

  // Send the full conversation history — no artificial cap.
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...cleaned,
  ];

  const groqKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const groqUsable = groqKey && Date.now() >= groqSkipUntil;

  // ---- Primary: Groq (streaming) ----
  if (groqUsable) {
    try {
      const upstream = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: groqModel,
          messages,
          temperature: 0.6,
          top_p: 0.9,
          stream: true,
        }),
      });

      if (upstream.ok && upstream.body) {
        return streamGroq(upstream);
      }

      // Groq returned an error — decide whether to skip it next time.
      const status = upstream.status;
      const shouldSkip = status === 401 || status === 403;
      if (shouldSkip) {
        groqSkipUntil = Date.now() + GROQ_SKIP_MS;
      }
      let detail = `Groq responded ${status}.`;
      try {
        const errJson = await upstream.json();
        detail =
          (errJson?.error?.message as string | undefined) || detail;
      } catch {
        // ignore
      }
      console.warn("[/api/chat] Groq failed, falling back to z-ai:", detail);
      // fall through to fallback
    } catch (err) {
      console.warn(
        "[/api/chat] Groq network error, falling back to z-ai:",
        (err as Error)?.message
      );
      // fall through to fallback
    }
  }

  // ---- Fallback: z-ai-web-dev-sdk (non-streaming, chunked emit) ----
  try {
    const text = await completeWithZai(messages);
    if (!text || !text.trim()) {
      return jsonError(
        "I didn't catch a response that time. Please try again, or message us directly.",
        502
      );
    }
    const stream = streamFromChunks(chunkText(text), 18);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[/api/chat] All providers failed:", (err as Error)?.message);
    return jsonError(
      "I couldn't reach my concierge service. Please try again, or message us directly and we'll help right away.",
      502
    );
  }
}

// Stream Groq's SSE, re-emitting only text deltas as { content }.
function streamGroq(upstream: Response): Response {
  const encoder = new TextEncoder();
  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.enqueue(encoder.encode(sseDone()));
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const evt of events) {
        const lines = evt.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") {
            controller.enqueue(encoder.encode(sseDone()));
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              controller.enqueue(encoder.encode(sseChunk(delta)));
            }
          } catch {
            // Ignore malformed chunks (e.g. keep-alive comments).
          }
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// Fallback completion via z-ai-web-dev-sdk.
// The skill docs specify passing the system prompt as an 'assistant'
// message, so we map the leading system message accordingly.
async function completeWithZai(messages: ChatMessage[]): Promise<string> {
  // Lazy import so the SDK is only loaded when actually needed.
  const ZAIModule = await import("z-ai-web-dev-sdk");
  const ZAI = (ZAIModule as { default?: unknown }).default ?? ZAIModule;
  const create = (ZAI as { create: () => Promise<ZaiClient> }).create;
  const zai = await create();

  const mapped = messages.map((m, i) =>
    i === 0 && m.role === "system"
      ? { role: "assistant" as const, content: m.content }
      : { role: m.role, content: m.content }
  );

  const completion = await (
    zai as ZaiClient
  ).chat.completions.create({
    messages: mapped,
    thinking: { type: "disabled" },
  });

  return completion?.choices?.[0]?.message?.content ?? "";
}

// Minimal structural type for the z-ai client (avoids pulling types
// that may not ship with the package).
interface ZaiClient {
  chat: {
    completions: {
      create: (args: {
        messages: { role: string; content: string }[];
        thinking?: { type: string };
      }) => Promise<{
        choices?: { message?: { content?: string } }[];
      }>;
    };
  };
}
