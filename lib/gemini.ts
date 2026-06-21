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

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
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
