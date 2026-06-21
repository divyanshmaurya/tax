/**
 * Google Gemini client for the assistant.
 *
 * Uses the Gemini REST API (generativelanguage.googleapis.com) with SSE
 * streaming — no SDK dependency, stable wire format. The API key is read from
 * GEMINI_API_KEY (free tier available via Google AI Studio); the model is
 * overridable via GEMINI_MODEL.
 *
 * The assistant's expertise lives in lib/systemPrompt.ts (provider-agnostic);
 * this module only handles transport.
 */

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * POST with a couple of retries on transient rate limits (429) and overload
 * (503). Honors the RetryInfo delay from Gemini's error body when present,
 * capped so we stay within the request timeout. The retry happens before any
 * streaming starts, so the user just waits a moment longer. Returns the final
 * Response (the caller handles a non-ok status).
 */
async function postWithRetry(url: string, body: string, key: string, maxRetries = 2): Promise<Response> {
  const headers = { "Content-Type": "application/json", "x-goog-api-key": key };
  let res!: Response;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    res = await fetch(url, { method: "POST", headers, body });
    if (res.status !== 429 && res.status !== 503) return res;
    if (attempt === maxRetries) return res;
    const text = await res.text().catch(() => "");
    const match = text.match(/"retryDelay":\s*"(\d+)s"/);
    const waitMs = Math.min(match ? Number(match[1]) * 1000 : (attempt + 1) * 2000, 8000);
    await new Promise((r) => setTimeout(r, waitMs));
  }
  return res;
}

/**
 * Stream a Gemini completion as text deltas.
 * @param system  the system instruction (grounding + intake context)
 * @param messages conversation turns (user/assistant), oldest first
 */
export async function* streamGemini(
  system: string,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;

  // Gemini uses role "model" for the assistant and has no "system" role in
  // contents — the system prompt goes in systemInstruction.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
  });

  const res = await postWithRetry(url, payload, key);

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    if (res.status === 429) {
      throw new Error(
        "Gemini free-tier limit reached (429). Per-minute limits clear in about a minute; " +
          "the daily limit resets next day (Pacific time). Check usage at https://ai.dev/rate-limit, " +
          "or enable billing on your Google Cloud project for much higher limits (this app's usage is " +
          "fractions of a cent per chat).",
      );
    }
    throw new Error(`Gemini API error ${res.status}. ${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are newline-delimited "data: {json}" lines.
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const parts = json?.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) {
          for (const p of parts) if (typeof p?.text === "string") yield p.text;
        }
      } catch {
        // Ignore partial/non-JSON keep-alive lines.
      }
    }
  }
}
