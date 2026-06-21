import type { Metadata } from "next";
import Link from "next/link";
import { Chat } from "@/components/Chat";

export const metadata: Metadata = {
  title: "AI Assistant — Form 8843 | Alien Tax Advisory",
  description: "Ask the Form 8843 assistant anything — grounded in the IRS rules and, optionally, your intake.",
};

export default function AssistantPage() {
  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_300px]">
      <div>
        <span className="chip bg-[var(--color-brand-soft)] text-[var(--color-brand)]">AI Assistant</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Ask about your Form 8843</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
          The assistant is grounded in the Form 8843 instructions and the firm&rsquo;s workflow. Fill out the{" "}
          <Link href="/intake" className="font-semibold text-[var(--color-brand)] hover:underline">intake</Link>{" "}
          first and it will tailor answers to your situation — including your day counts and exempt years.
        </p>
        <div className="mt-6">
          <Chat />
        </div>
      </div>

      <aside className="space-y-5">
        <div className="card p-5">
          <h2 className="text-sm font-bold">Good things to ask</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
            <li>• Whether you need to file at all</li>
            <li>• How your days are counted and excluded</li>
            <li>• Which part of the form applies to you</li>
            <li>• What a status change means for line 1a/1b</li>
            <li>• How and where to mail the form</li>
          </ul>
        </div>
        <div className="card bg-[var(--color-warn-soft)] p-5">
          <h2 className="text-sm font-bold text-[var(--color-warn)]">Keep it safe</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Don&rsquo;t paste your full Social Security number or upload documents in chat. The intake
            form is the secure place for sensitive details; the last four digits are enough here.
          </p>
        </div>
      </aside>
    </div>
  );
}
