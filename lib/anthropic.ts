/**
 * Anthropic client factory.
 *
 * The chatbot runs on Claude Opus 4.8 (claude-opus-4-8). The API key is read
 * from the ANTHROPIC_API_KEY environment variable — never hardcode it. We export
 * a small helper so every server route constructs the client the same way and
 * degrades gracefully when the key is missing (the rest of the site still runs).
 */

import Anthropic from "@anthropic-ai/sdk";

/** The model the assistant uses. See README for why Opus 4.8. */
export const CHAT_MODEL = "claude-opus-4-8";

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;

/** Returns a singleton Anthropic client, or null if no API key is configured. */
export function getAnthropic(): Anthropic | null {
  if (!hasApiKey()) return null;
  if (!client) client = new Anthropic();
  return client;
}
