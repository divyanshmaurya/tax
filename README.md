# Alien Tax Advisory — Form 8843 platform

A web application and AI chatbot for **Hanchen (Hanks) Liu**'s international‑tax practice. It helps
nonresident‑alien students and scholars (most commonly **F‑1 students with no income**) prepare and
file **IRS Form 8843**, "Statement for Exempt Individuals and Individuals With a Medical Condition,"
for the **2025 tax year**.

It turns the advisor's manual, ChatGPT‑assisted workflow into a repeatable product:

- a guided **intake** (the Information Request Checklist) with a **live Substantial Presence Test** calculator,
- a **ready‑to‑file PDF** that overlays the client's data onto the official IRS Form 8843 (plus an
  auto‑generated visa‑status statement when status changed mid‑year), and
- an **AI assistant** grounded in the Form 8843 rules and, optionally, the client's own intake.

---

## Why this matches the engagement

The firm's three‑step engagement is reflected throughout the app:

1. **Introduction & engagement letter** — the home page explains the service, scope, and pricing
   ($50 preparation, +$15 if the firm mails it).
2. **Payment & information checklist** — the `/intake` page is the digital checklist.
3. **Preparation, review & mailing** — `/intake` generates the filled form; the advisor reviews and the
   client signs and mails it to the IRS in Austin, TX.

The assistant encodes the same line‑by‑line guidance, common mistakes, and final checklist the advisor
uses by hand — so the chatbot and the website never drift apart (both read from `data/knowledge.ts`).

---

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling
- **Google Gemini** (`gemini-2.0-flash`, free tier) via the REST API for the assistant (SSE streaming)
- **pdf-lib** for filling the official IRS PDF
- **Zod** for request validation

## Project structure

```
app/
  page.tsx              Landing page (services, 3-step process, features)
  guide/page.tsx        Form 8843 guide & FAQ
  intake/page.tsx       Intake form + live SPT calculator + PDF generation (client)
  assistant/page.tsx    AI assistant page
  api/
    chat/route.ts       Streaming chat endpoint (Claude)
    form8843/route.ts   Form 8843 PDF generation endpoint
components/
  Chat.tsx              Streaming chat UI (markdown, intake-aware)
  SiteHeader / SiteFooter
lib/
  form8843.ts           Domain model + Substantial Presence Test + validation (framework-agnostic)
  pdf.ts                Fills the official IRS Form 8843 with pdf-lib (server-only)
  systemPrompt.ts       The assistant's grounded system prompt + intake context builder
  gemini.ts             Gemini client (REST + SSE streaming; reads GEMINI_API_KEY)
  sample.ts             A fictional sample intake (no real PII)
data/
  knowledge.ts          Form 8843 knowledge base (shared by the prompt and the Guide page)
public/forms/
  f8843-2025.pdf        The official blank IRS Form 8843 (2025) — a public-domain government work
```

---

## Getting started

```bash
npm install
cp .env.example .env.local      # then add your GEMINI_API_KEY (free — for the assistant)
npm run dev                      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
```

> The intake, calculator, Guide, and **Form 8843 PDF generation all work without an API key.**
> Only the `/assistant` chatbot needs `GEMINI_API_KEY`; without it, the chat returns a clear
> "not configured" message instead of failing.

## Deploy to Vercel

1. On [vercel.com](https://vercel.com): **Add New → Project** and import this repo.
2. Next.js is auto-detected (build `next build`, no extra settings).
3. Add the environment variable **`GEMINI_API_KEY`** (Project → Settings → Environment Variables) —
   get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
4. **Deploy.** Every push to a branch/PR gets a preview URL; `main` becomes production.

The server routes (`/api/chat` streaming, `/api/form8843`) run as Node serverless functions.
`next.config.ts` sets `outputFileTracingIncludes` so the blank IRS form under `public/forms/` is bundled
into the PDF route's function — without it, serverless file tracing can omit `public/` assets and the
PDF route would 500 in production.

---

## How the chatbot is "built/trained"

There is no model fine‑tuning here — the assistant is **grounded** (the practical, reliable way to make
an LLM an expert on a narrow domain):

- `lib/systemPrompt.ts` encodes the firm's scope, the IRS rules (Substantial Presence Test, exempt
  individuals, Part I/II/III line‑by‑line), the mailing instructions, the common mistakes, and the firm's
  guardrails (general info only, no full SSNs in chat, flag income → possible 1040‑NR engagement).
- When the client has filled out the intake and clicked **"Save for the AI assistant,"** the chat sends a
  compact, **PII‑light** summary of their intake (full SSN omitted) so the assistant can answer with their
  actual day counts, exempt‑year count, and recommended line 4b — and show the arithmetic.
- The endpoint streams responses from **Gemini** (`gemini-2.0-flash` by default; set `GEMINI_MODEL` to
  `gemini-2.5-flash`/`gemini-2.5-pro` for more capability) at a low temperature for accurate, calculated answers.

## How the form is filled

`public/forms/f8843-2025.pdf` is the official blank IRS form (a U.S. government work, public domain — the
only client‑provided file committed here; **no client PII is in the repository**). `lib/pdf.ts` overlays the
client's values at coordinates measured from the official 2025 layout (via `pdfplumber` word extraction and
verified by rendering), then drops the two IRS instruction pages so the output is just the two fileable
pages. If the client's status changed mid‑year, a clean **Visa Status Statement** page is appended.

## The tax logic

`lib/form8843.ts` is framework‑agnostic and unit‑testable:

- `computeSubstantialPresence()` — `days2025 + days2024/3 + days2023/6 ≥ 183` (and ≥ 31 days in 2025).
- `evaluateExemptStatus()` — counts exempt calendar years, derives lines 8/12, recommends line 4b (the days
  to exclude), and surfaces advisor warnings (e.g. > 5 exempt years, green‑card steps, income present).
- `validateForm8843()` — the pre‑mail checklist, mirrored in the UI.

---

## Privacy & safety

- Client data stays in the browser unless the user explicitly generates a PDF or saves it for the assistant.
- The chat is instructed not to collect full SSNs; the intake form is the place for sensitive details.
- Note: on Gemini's **free tier**, Google may use prompts to improve its products. The assistant is
  designed to stay PII-light (no full SSN), but for a production practice consider a paid Gemini tier or
  Vertex AI, which offer stronger data-use protections.
- This platform provides **general information and preparation support**, not individualized tax/legal advice.
  Every form is reviewed by the advisor and signed by the client before filing. Not affiliated with the IRS.

## Suggested next steps (for the practice)

- Authentication + a per‑client dashboard, with e‑signature on the engagement letter.
- Payment (Stripe) and status tracking across the three engagement steps.
- Persisted, encrypted client records (currently browser‑local) and an audit trail.
- Teacher/trainee (Part II) full coverage and the medical‑condition (Part V) path.
- Document upload (I‑20, I‑94) with extraction to pre‑fill the checklist.
