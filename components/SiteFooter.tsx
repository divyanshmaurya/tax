import Link from "next/link";
import { ADVISOR_NAME, ADVISOR_TITLE, FIRM_NAME } from "@/lib/systemPrompt";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        <div>
          <p className="text-sm font-bold">{FIRM_NAME}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {ADVISOR_NAME}
            <br />
            {ADVISOR_TITLE}
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Explore</p>
          <ul className="mt-2 space-y-1.5 text-[var(--color-muted)]">
            <li><Link href="/guide" className="hover:text-[var(--color-ink)]">Form 8843 guide & FAQ</Link></li>
            <li><Link href="/intake" className="hover:text-[var(--color-ink)]">Intake & form generator</Link></li>
            <li><Link href="/assistant" className="hover:text-[var(--color-ink)]">AI assistant</Link></li>
          </ul>
        </div>
        <div className="text-xs leading-relaxed text-[var(--color-muted)]">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Disclaimer</p>
          <p className="mt-2">
            This platform provides general information and preparation support for IRS Form 8843. It is
            not legal or individualized tax advice and does not create a client relationship until an
            engagement letter is signed. Every form is reviewed by the advisor and signed by the client
            before filing. Do not submit Social Security numbers or sensitive documents over chat.
          </p>
        </div>
      </div>
      <div className="border-t border-[var(--color-line)] py-4">
        <p className="container-page text-xs text-[var(--color-muted)]">
          © {new Date().getFullYear()} {FIRM_NAME}. For the 2025 tax year. Not affiliated with the IRS.
        </p>
      </div>
    </footer>
  );
}
