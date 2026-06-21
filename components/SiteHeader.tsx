import Link from "next/link";
import { FIRM_NAME } from "@/lib/systemPrompt";

const NAV = [
  { href: "/guide", label: "Guide" },
  { href: "/intake", label: "Intake & Form" },
  { href: "/assistant", label: "AI Assistant" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-white/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-brand)] text-white shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 2c3.9 0 7 3.1 7 7 0 3.2-2.3 6.9-7 11C7.3 15.9 5 12.2 5 9c0-3.9 3.1-7 7-7Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="9.5" cy="9" r="1.2" fill="currentColor" />
              <circle cx="14.5" cy="9" r="1.2" fill="currentColor" />
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight">{FIRM_NAME}</span>
            <span className="text-[11px] text-[var(--color-muted)]">Form 8843 specialists</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 font-medium text-[var(--color-muted)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/intake" className="btn-primary ml-1 hidden sm:inline-flex">
            Start
          </Link>
        </nav>
      </div>
    </header>
  );
}
