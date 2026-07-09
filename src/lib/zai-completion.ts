// ============================================================
// z-ai completion helper with retry + robust error handling
//
// The z-ai-web-dev-sdk's sandbox can intermittently go
// "inactive" (session expiry / quota / infra hiccup). When
// that happens the API returns an error that we want to
// handle gracefully: retry once after a short delay, and if
// it still fails, throw a typed error the caller can catch.
//
// Shared by /api/chat (public concierge) and
// /api/admin/chat (admin copilot).
// ============================================================

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ZaiCompletionResponse {
  choices?: { message?: { content?: string } }[];
  // The z-ai API sometimes returns an `error` field in the
  // body even with a 200 status — we check for it explicitly.
  error?: string;
}

interface ZaiClient {
  chat: {
    completions: {
      create: (args: {
        messages: { role: string; content: string }[];
        thinking?: { type: string };
      }) => Promise<ZaiCompletionResponse>;
    };
  };
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

// Errors that are likely transient and worth retrying.
const TRANSIENT_PATTERNS = [
  "sandbox is inactive",
  "inactive",
  "timeout",
  "timed out",
  "rate limit",
  "429",
  "502",
  "503",
  "504",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "fetch failed",
  "network",
];

function isTransientError(message: string): boolean {
  const lower = message.toLowerCase();
  return TRANSIENT_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Complete a chat using the z-ai-web-dev-sdk, with automatic
 * retry on transient errors (e.g. "sandbox is inactive").
 *
 * The system prompt is mapped to an 'assistant' message per
 * the z-ai skill docs.
 *
 * Throws an Error if all retries fail. The caller is
 * responsible for catching and returning a user-friendly
 * response.
 */
export async function completeWithZai(
  messages: ChatMessage[]
): Promise<string> {
  const ZAIModule = await import("z-ai-web-dev-sdk");
  const ZAI =
    (ZAIModule as { default?: { create: () => Promise<ZaiClient> } })
      .default ??
    (ZAIModule as { create: () => Promise<ZaiClient> });
  const zai = await ZAI.create();

  // Map the leading system message to 'assistant' (z-ai quirk).
  const mapped = messages.map((m, i) =>
    i === 0 && m.role === "system"
      ? { role: "assistant" as const, content: m.content }
      : { role: m.role, content: m.content }
  );

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await zai.chat.completions.create({
        messages: mapped,
        thinking: { type: "disabled" },
      });

      // The z-ai API can return 200 OK but with an `error` field
      // in the body (e.g. "sandbox is inactive"). Detect and retry.
      if (completion?.error) {
        const errMsg = completion.error;
        console.warn(
          `[z-ai] attempt ${attempt + 1} returned error field:`,
          errMsg
        );
        if (isTransientError(errMsg) && attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        throw new Error(`z-ai API error: ${errMsg}`);
      }

      const text = completion?.choices?.[0]?.message?.content ?? "";
      if (!text || !text.trim()) {
        // Empty response — treat as transient and retry.
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
      }

      return text;
    } catch (err) {
      const msg = (err as Error)?.message ?? "Unknown error";
      lastError = err as Error;
      console.warn(`[z-ai] attempt ${attempt + 1} failed:`, msg);

      if (isTransientError(msg) && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new Error("z-ai completion failed after retries");
}
