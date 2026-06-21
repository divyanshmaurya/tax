/**
 * Form 8843 knowledge base.
 *
 * Distilled from the official IRS Form 8843 (2025) instructions and the
 * advisor's own line-by-line workflow. Used both to ground the AI assistant
 * (see lib/systemPrompt.ts) and to render the human-facing Guide page, so the
 * chatbot and the website never drift apart.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export interface ProcessStep {
  n: number;
  title: string;
  description: string;
}

/** The advisor's three-step client engagement. */
export const ENGAGEMENT_STEPS: ProcessStep[] = [
  {
    n: 1,
    title: "Introduction & engagement letter",
    description:
      "We introduce the service and confirm you actually need Form 8843. Once you decide to proceed, " +
      "we send the engagement letter — a legal contract defining scope (Form 8843 only), fees, and " +
      "responsibilities — for your signature.",
  },
  {
    n: 2,
    title: "Payment & information checklist",
    description:
      "After the signed contract and payment, you complete the Information Request Checklist: passport " +
      "and visa details, I-20 program information, U.S. and home addresses, and your visa history. " +
      "Everything is kept strictly confidential.",
  },
  {
    n: 3,
    title: "Preparation, review & mailing",
    description:
      "We prepare your Form 8843 (typically within 1–3 business days), you review and sign it, and it " +
      "is mailed to the IRS in Austin, TX. We can mail it for you for a small service fee.",
  },
];

/** Pricing from the engagement letter. */
export const PRICING = {
  preparation: 50,
  mailingPerForm: 15,
  currency: "USD",
} as const;

/** Common mistakes the advisor checks for (from the real working notes). */
export const COMMON_MISTAKES: string[] = [
  "Forgetting to sign — an unsigned Form 8843 is auto-rejected.",
  "Not filling the address blocks when filing the form by itself (standalone).",
  "Using the wrong 'latest entry date' on line 1a.",
  "Not excluding all exempt days on line 4b.",
  "Completing Part II (Teachers and Trainees) instead of Part III (Students) for an F-1 student.",
];

/** Final pre-mail checklist (mirrors validateForm8843). */
export const FINAL_CHECKLIST: string[] = [
  "All of Part I is filled in.",
  "Part III is completed (students) — not Part II.",
  "Days are calculated correctly (lines 4a / 4b).",
  "Line 4b excludes the full set of exempt days.",
  "The form is signed and dated.",
  "Mailed to the Department of the Treasury, IRS Center, Austin, TX 73301-0215.",
];

/** What to include — and not include — in the mailing envelope. */
export const ENVELOPE = {
  include: ["Signed Form 8843", "Optional visa-timeline statement (if status changed mid-year)"],
  exclude: ["W-2", "1099", "Passport copy", "I-20"],
};

export const FAQ: FaqItem[] = [
  {
    q: "Who has to file Form 8843?",
    a: "Nonresident alien individuals present in the U.S. under an F, J, M, or Q visa (students) or J/Q " +
      "(teachers/trainees) file Form 8843 to exclude days of presence from the Substantial Presence Test. " +
      "An F-1 student with no income still files Form 8843 by itself.",
  },
  {
    q: "I'm an F-1 student with no income. Do I really need to file anything?",
    a: "Yes. Even with zero U.S. income, an exempt individual generally must file Form 8843 to document " +
      "their exempt status for the tax year. It is filed by itself, not attached to a tax return.",
  },
  {
    q: "What is the Substantial Presence Test?",
    a: "You are treated as a U.S. resident for tax if you are present at least 31 days in the current year " +
      "and 183 weighted days over three years (all of this year + 1/3 of last year + 1/6 of the year before). " +
      "Exempt individuals exclude their exempt days, which is what Form 8843 reports.",
  },
  {
    q: "Which part of the form do I complete?",
    a: "F-1 / M-1 / J-1 students complete Part I and Part III. J/Q teachers and trainees complete Part I " +
      "and Part II. Most international students should be in Part III — a very common mistake is filling Part II.",
  },
  {
    q: "How many years can a student stay exempt?",
    a: "Generally up to 5 calendar years. Any part of a year counts as a full year. Beyond 5 years you must " +
      "establish (on an attached statement) that you do not intend to reside permanently in the U.S.",
  },
  {
    q: "Where and when do I mail it?",
    a: "If you are not filing a tax return, mail Form 8843 by itself to the Department of the Treasury, " +
      "Internal Revenue Service Center, Austin, TX 73301-0215, by the Form 1040-NR due date (including extensions).",
  },
  {
    q: "My visa status changed during the year. What then?",
    a: "Enter your most recent entry and current status on lines 1a/1b, and optionally attach a short visa-" +
      "timeline statement listing each status and its dates. The platform can generate that statement for you.",
  },
];

/** Line-by-line guidance for an F-1 student (the common case). */
export interface LineGuide {
  line: string;
  label: string;
  guidance: string;
}

export const LINE_GUIDE: LineGuide[] = [
  { line: "1a", label: "Visa type + entry date", guidance: "Your current nonimmigrant visa (e.g. F-1) and the date of your most recent U.S. entry (check the CBP I-94)." },
  { line: "1b", label: "Current status", guidance: "Your status on Dec 31. If it changed in-country, add the date of change and previous status." },
  { line: "2", label: "Citizenship", guidance: "Country/countries of citizenship during the tax year." },
  { line: "3a/3b", label: "Passport", guidance: "Country that issued your passport, and the passport number." },
  { line: "4a", label: "Days present", guidance: "Actual days physically present in the U.S. in 2025, 2024, and 2023." },
  { line: "4b", label: "Days excluded", guidance: "Days in 2025 you exclude as an exempt individual — typically all of your exempt days." },
  { line: "9", label: "Academic institution", guidance: "Name, address, and phone of the school you attended in 2025 (from your I-20)." },
  { line: "10", label: "Program director / DSO", guidance: "Name, address, and phone of your Designated School Official / program director (from your I-20)." },
  { line: "11", label: "Visa history 2019–2024", guidance: "The visa type you held each prior year; 'N/A' for years you were not in the U.S." },
  { line: "12", label: "Exempt > 5 years?", guidance: "Were you exempt as a student/teacher/trainee for more than 5 calendar years? Usually 'No' for recent students." },
  { line: "13", label: "Green-card steps?", guidance: "Did you apply for or take steps toward U.S. permanent residence? Usually 'No'." },
  { line: "14", label: "Explanation", guidance: "Only if line 13 is 'Yes' — briefly explain." },
];
