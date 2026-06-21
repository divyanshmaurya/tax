/**
 * POST /api/chat — streaming Form 8843 assistant.
 *
 * Body: { messages: {role, content}[], intake?: Form8843Input }
 * Returns: a streamed text/plain response (the assistant's answer), or 503 JSON
 * when ANTHROPIC_API_KEY is not configured so the UI can show setup guidance.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { CHAT_MODEL, getAnthropic } from "@/lib/anthropic";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import type { Form8843Input } from "@/lib/form8843";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(20_000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  // Intake is free-form here; the typed shape lives in lib/form8843. We accept
  // it loosely and let buildSystemPrompt read the fields it needs.
  intake: z.unknown().optional(),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const client = getAnthropic();
  if (!client) {
    return Response.json(
      {
        error:
          "The assistant is not configured. Set the ANTHROPIC_API_KEY environment variable " +
          "(see .env.example) and restart the server to enable the chatbot.",
      },
      { status: 503 },
    );
  }

  const system = buildSystemPrompt(parsed.intake as Form8843Input | undefined);

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: CHAT_MODEL,
          max_tokens: 8000,
          thinking: { type: "adaptive" },
          system,
          messages: parsed.messages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        await stream.finalMessage();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "The assistant ran into an error.";
        controller.enqueue(encoder.encode(`\n\n_Error: ${message}_`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
