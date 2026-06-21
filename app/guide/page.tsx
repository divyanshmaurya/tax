import Link from "next/link";
import type { Metadata } from "next";
import { ENVELOPE, FAQ, FINAL_CHECKLIST, LINE_GUIDE } from "@/data/knowledge";
import { IRS_MAILING_ADDRESS } from "@/lib/form8843";

export const metadata: Metadata = {
  title: "Form 8843 guide & FAQ — Alien Tax Advisory",
  description: "Plain-language guide to IRS Form 8843: who files, the substantial-presence test, line-by-line entries, and mailing.",
};

export default function GuidePage() {
  return (
    <div className="container-page py-12">
      <header className="max-w-2xl">
        <span className="chip bg-[var(--color-brand-soft)] text-[var(--color-brand)]">Guide</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Form 8843, explained</h1>
        <p className="mt-3 text-[var(--color-muted)]">
          Everything an F-1 student needs to understand the &ldquo;Statement for Exempt Individuals.&rdquo;
          Have a specific question? The{" "}
          <Link href="/assistant" className="font-semibold text-[var(--color-brand)] hover:underline">
            AI assistant
          </Link>{" "}
          answers using these same rules and your intake.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* FAQ */}
        <section>
          <h2 className="text-xl font-bold">Frequently asked questions</h2>
          <div className="mt-4 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="card group p-5 open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {item.q}
                  <span className="text-[var(--color-brand)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{item.a}</p>
              </details>
            ))}
          </div>

          <h2 className="mt-10 text-xl font-bold">Line-by-line (F-1 student)</h2>
          <div className="card mt-4 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-canvas)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-2.5">Line</th>
                  <th className="px-4 py-2.5">Field</th>
                  <th className="px-4 py-2.5">What to enter</th>
                </tr>
              </thead>
              <tbody>
                {LINE_GUIDE.map((g) => (
                  <tr key={g.line} className="border-t border-[var(--color-line)] align-top">
                    <td className="px-4 py-3 font-mono font-semibold text-[var(--color-brand)]">{g.line}</td>
                    <td className="px-4 py-3 font-medium">{g.label}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{g.guidance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-bold">Final checklist before mailing</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
              {FINAL_CHECKLIST.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-[var(--color-accent)]">☑</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold">What to mail</h3>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">Include</p>
            <ul className="mt-1 space-y-1 text-sm text-[var(--color-muted)]">
              {ENVELOPE.include.map((i) => <li key={i}>• {i}</li>)}
            </ul>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-warn)]">Do not include</p>
            <ul className="mt-1 space-y-1 text-sm text-[var(--color-muted)]">
              {ENVELOPE.exclude.map((i) => <li key={i}>• {i}</li>)}
            </ul>
          </div>

          <div className="card bg-[var(--color-brand-soft)] p-5">
            <h3 className="text-sm font-bold">Mail it to</h3>
            <address className="mt-2 not-italic text-sm leading-relaxed text-[var(--color-ink)]">
              {IRS_MAILING_ADDRESS.map((l) => <span key={l} className="block">{l}</span>)}
            </address>
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              By the Form 1040-NR due date, including extensions. File the form by itself when you have
              no tax return to attach it to.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
