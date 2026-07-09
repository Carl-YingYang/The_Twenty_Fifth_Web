import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { buildAdminCopilotSystemPrompt } from "@/lib/admin-copilot-knowledge";
import { completeWithZai } from "@/lib/zai-completion";

// ============================================================
// /api/admin/chat — Admin Copilot ("Aria") chat endpoint
//
// Auth-gated (ADMIN / STAFF / SUPER_ADMIN only). Streams replies
// via the same Groq → z-ai fallback used by the public concierge.
// Per the owner's policy, no message/length/token caps are applied
// — Aria can carry long operational conversations.
//
// Aria may emit an action proposal as a fenced ```aria-action JSON
// block at the end of her reply. The client parses that block out
// and renders an approval card; nothing executes until the admin
// approves it via /api/admin/chat/execute.
// ============================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
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

function streamFromChunks(chunks: string[], delayMs = 0): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(sseChunk(chunk)));
        if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
      }
      controller.enqueue(encoder.encode(sseDone()));
      controller.close();
    },
  });
}

function chunkText(text: string): string[] {
  if (!text) return [];
  const words = text.match(/\S+\s*/g) ?? [text];
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 6) {
    chunks.push(words.slice(i, i + 6).join(""));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  // ---- Auth gate ----
  const { user, response } = await requireAuth(req);
  if (!user) return response!;

  // ---- Parse body ----
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

  if (cleaned.length === 0) return jsonError("No valid messages provided.", 400);
  if (cleaned[cleaned.length - 1].role !== "user") {
    return jsonError("Last message must be from the user.", 400);
  }

  // ---- Build system prompt with live ops context ----
  let systemPrompt: string;
  try {
    systemPrompt = await buildAdminCopilotSystemPrompt();
  } catch {
    return jsonError("Couldn't load the operations snapshot. Please try again.", 500);
  }

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
          temperature: 0.4,
          top_p: 0.9,
          stream: true,
        }),
      });

      if (upstream.ok && upstream.body) {
        return streamGroq(upstream);
      }

      const status = upstream.status;
      if (status === 401 || status === 403) {
        groqSkipUntil = Date.now() + GROQ_SKIP_MS;
      }
      let detail = `Groq responded ${status}.`;
      try {
        const errJson = await upstream.json();
        detail = (errJson?.error?.message as string | undefined) || detail;
      } catch {
        // ignore
      }
      console.warn("[/api/admin/chat] Groq failed, falling back to z-ai:", detail);
    } catch (err) {
      console.warn(
        "[/api/admin/chat] Groq network error, falling back to z-ai:",
        (err as Error)?.message
      );
    }
  }

  // ---- Fallback: z-ai-web-dev-sdk ----
  try {
    const text = await completeWithZai(messages);
    if (!text || !text.trim()) {
      return jsonError("I didn't catch a response that time. Please try again.", 502);
    }
    const stream = streamFromChunks(chunkText(text), 16);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[/api/admin/chat] All providers failed:", (err as Error)?.message);
    return jsonError(
      "I couldn't reach the copilot service. Please try again.",
      502
    );
  }
}

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
            // ignore malformed chunks
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

// Fallback completion is now in @/lib/zai-completion (shared with public chat),
// with retry logic for transient "sandbox is inactive" errors.
