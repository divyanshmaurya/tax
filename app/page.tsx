import Link from "next/link";
import { ENGAGEMENT_STEPS, PRICING, COMMON_MISTAKES } from "@/data/knowledge";
import { ADVISOR_NAME, ADVISOR_TITLE, FIRM_NAME } from "@/lib/systemPrompt";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--color-line)] bg-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[var(--color-brand-soft)] blur-3xl" />
        <div className="container-page relative grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="chip bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              For F-1 / J-1 students &amp; scholars · 2025 tax year
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">
              File <span className="text-[var(--color-brand)]">Form 8843</span> with confidence.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-[var(--color-muted)]">
              Most international students must file Form 8843 even with no income. {FIRM_NAME} pairs a
              tax specialist with an AI assistant to guide your intake, run the substantial-presence
              test, and produce a ready-to-file PDF.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/intake" className="btn-primary">
                Start your Form 8843
              </Link>
              <Link href="/assistant" className="btn-ghost">
                Ask the AI assistant
              </Link>
            </div>
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              ${PRICING.preparation} flat preparation · +${PRICING.mailingPerForm} if we mail it for you.
            </p>
          </div>

          {/* Hero card: the form preview */}
          <div className="card p-6">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <p className="text-sm font-semibold">Form 8843 (2025)</p>
              <span className="chip bg-[var(--color-brand-soft)] text-[var(--color-brand)]">Auto-filled</span>
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              {[
                ["Line 1a — Visa & entry", "F-1, Aug 18, 2025"],
                ["Line 4a — Days in U.S. (2025)", "136"],
                ["Line 4b — Days excluded", "136"],
                ["Part III — Students", "Completed"],
                ["Substantial Presence Test", "Nonresident ✓"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--color-muted)]">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 rounded-xl bg-[var(--color-canvas)] p-3 text-xs text-[var(--color-muted)]">
              Mailed to: Department of the Treasury, IRS Center, Austin, TX 73301-0215
            </div>
          </div>
        </div>
      </section>

      {/* Who needs it */}
      <section className="container-page py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Exempt individuals",
              body: "F, J, M, or Q students (and J/Q teachers/trainees) exclude days of U.S. presence from the substantial-presence test by filing Form 8843.",
            },
            {
              title: "Even with no income",
              body: "An F-1 student with zero U.S. income still files Form 8843 by itself — it documents your nonresident status for the year.",
            },
            {
              title: "Filed on time",
              body: "Mailed to the IRS by the Form 1040-NR due date (including extensions). We prepare it in 1–3 business days after we have your info.",
            },
          ].map((c) => (
            <div key={c.title} className="card p-6">
              <h3 className="text-base font-bold">{c.title}</h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3-step process */}
      <section className="border-y border-[var(--color-line)] bg-white py-16">
        <div className="container-page">
          <h2 className="text-2xl font-extrabold tracking-tight">How it works</h2>
          <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
            A clear, three-step engagement — from introduction to a form in the mail.
          </p>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {ENGAGEMENT_STEPS.map((s) => (
              <li key={s.n} className="card p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-brand)] text-base font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{s.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-16">
        <div className="grid items-start gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Built to avoid the common mistakes</h2>
            <p className="mt-2 text-[var(--color-muted)]">
              The platform encodes the rules an unsigned or mis-filed form gets rejected for — so your
              filing is right the first time.
            </p>
            <ul className="mt-6 space-y-3">
              {COMMON_MISTAKES.map((m) => (
                <li key={m} className="flex gap-3 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    ✓
                  </span>
                  <span className="text-[var(--color-muted)]">{m}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4">
            <FeatureCard
              title="AI assistant, grounded in the rules"
              body="Ask anything about Form 8843. The assistant knows the substantial-presence test, the line-by-line entries, and your intake — and shows its work."
              href="/assistant"
              cta="Open the assistant"
            />
            <FeatureCard
              title="Substantial-presence calculator"
              body="Enter your days in the U.S. and see your weighted total, exempt years, and recommended line 4b — instantly."
              href="/intake"
              cta="Run the calculator"
            />
            <FeatureCard
              title="Ready-to-file PDF"
              body="Generate the official 2025 Form 8843, filled and ready to print, sign, and mail — with a visa-timeline statement when your status changed."
              href="/intake"
              cta="Generate the form"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="card flex flex-col items-start justify-between gap-6 bg-[var(--color-brand)] p-8 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold">Ready to start?</h2>
            <p className="mt-1 text-white/85">
              Fill out the intake, generate your form, and {ADVISOR_NAME.split("(")[0].trim()} will review it before you sign.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/intake" className="btn bg-white text-[var(--color-brand)] hover:bg-white/90">
              Start intake
            </Link>
            <Link href="/guide" className="btn border border-white/40 text-white hover:bg-white/10">
              Read the guide
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
          {ADVISOR_TITLE}. Information only; not a substitute for advice from your tax advisor.
        </p>
      </section>
    </>
  );
}

function FeatureCard({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="card p-6">
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--color-muted)]">{body}</p>
      <Link href={href} className="mt-3 inline-flex text-sm font-semibold text-[var(--color-brand)] hover:underline">
        {cta} →
      </Link>
    </div>
  );
}
