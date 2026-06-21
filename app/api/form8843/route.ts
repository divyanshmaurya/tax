/**
 * POST /api/form8843 — generate the filled Form 8843 PDF.
 *
 * Body: { input: Form8843Input, signed?: boolean }
 * Returns: application/pdf (the filled official form, plus a visa-status
 * statement page when the client's status changed mid-year).
 */

import { NextRequest } from "next/server";
import { generateForm8843 } from "@/lib/pdf";
import { validateForm8843, type Form8843Input } from "@/lib/form8843";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { input?: Form8843Input; signed?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.input || !body.input.personal || !body.input.daysPresent) {
    return Response.json({ error: "Missing or malformed 'input'." }, { status: 400 });
  }

  // Surface blocking validation problems, but still allow generation of a draft
  // for review — the advisor checks the form before the client signs.
  const problems = validateForm8843(body.input);

  try {
    const bytes = await generateForm8843(body.input, Boolean(body.signed));
    const last = body.input.personal.lastName?.replace(/[^a-z0-9]/gi, "") || "form";
    // Uint8Array → ArrayBuffer slice keeps the body a valid BodyInit.
    return new Response(bytes.slice().buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Form8843-${last}-2025.pdf"`,
        "X-Form-Validation": problems.length ? "incomplete" : "ok",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate the form.";
    return Response.json({ error: message }, { status: 500 });
  }
}
