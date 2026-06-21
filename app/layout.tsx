import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FIRM_NAME } from "@/lib/systemPrompt";

export const metadata: Metadata = {
  title: `${FIRM_NAME} — Form 8843 for international students`,
  description:
    "Prepare IRS Form 8843 for nonresident alien students and scholars. AI-guided intake, " +
    "substantial-presence calculator, and a ready-to-file PDF — reviewed by a tax specialist.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
