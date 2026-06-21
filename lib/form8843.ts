/**
 * Form 8843 domain model and tax logic.
 *
 * This module is framework-agnostic (no React / Next imports) so it can be
 * shared between the browser (intake form, live calculator) and the server
 * (PDF generation, chatbot context).
 *
 * Form 8843 — "Statement for Exempt Individuals and Individuals With a Medical
 * Condition" — is filed by nonresident aliens (e.g. F-1 students) to explain
 * why days of U.S. presence are excluded from the Substantial Presence Test
 * (SPT). Nothing here is tax advice; it encodes the mechanical rules from the
 * official IRS instructions so the advisor can review and sign.
 */

export const TAX_YEAR = 2025;

/** The six prior years the 2025 Form 8843 asks about (lines 7 and 11). */
export const PRIOR_VISA_YEARS = [2019, 2020, 2021, 2022, 2023, 2024] as const;

/** Years of physical-presence day counts the form asks for (line 4a). */
export const PRESENCE_YEARS = [2025, 2024, 2023] as const;

export type VisaType = "F" | "J" | "M" | "Q" | "G" | "B" | "H" | "A" | "Other" | "None";

/** Which part of the form an individual completes. */
export type FilingCategory = "student" | "teacher_trainee" | "other";

export interface PersonalInfo {
  firstName: string;
  middleInitial: string;
  lastName: string;
  /** U.S. taxpayer ID (SSN/ITIN) if any. Optional for many F-1 students. */
  taxpayerId: string;
  countryOfCitizenship: string;
  passportCountry: string;
  passportNumber: string;
  addressInCountryOfResidence: string;
  addressInUnitedStates: string;
}

/** A single leg of a visa-status timeline (used for the attached statement). */
export interface VisaSegment {
  status: string; // e.g. "F-1", "G-4", "B-1/B-2"
  from: string; // ISO date "YYYY-MM-DD"
  to: string; // ISO date "YYYY-MM-DD"
  note?: string;
}

export interface AcademicInstitution {
  name: string;
  address: string;
  phone: string;
}

/** Director of an academic / cultural-exchange program (line 10). */
export interface ProgramDirector {
  name: string;
  address: string;
  phone: string;
}

export interface Form8843Input {
  personal: PersonalInfo;
  filingCategory: FilingCategory;

  /** Line 1a: current visa type and most-recent U.S. entry date. */
  currentVisaType: string;
  mostRecentEntryDate: string; // ISO

  /** Line 1b: nonimmigrant status on the last day of the tax year. */
  currentStatusEndOfYear: string;
  /** Optional: prior status + change date, when status changed in-country. */
  statusChange?: { previousStatus: string; dateOfChange: string };

  /** Line 4a: actual days physically present in the U.S., by year. */
  daysPresent: { 2025: number; 2024: number; 2023: number };

  /**
   * Visa type held during each year 2019–2025. "None"/"N/A" if not in the U.S.
   * Used for lines 7 / 11 and for counting exempt calendar years.
   */
  visaHistory: Record<number, VisaType>;

  /** Part III line 9 (students) / Part II line 5 (teachers). */
  institution: AcademicInstitution;
  /** Part III line 10 / Part II line 6 — program director / DSO. */
  director: ProgramDirector;

  /** Line 13: applied for / took steps toward lawful permanent residence? */
  appliedForGreenCard: boolean;
  /** Line 14: explanation when line 13 is "Yes". */
  greenCardExplanation?: string;

  /** Full visa timeline for the optional attached statement (if multi-status). */
  visaTimeline: VisaSegment[];

  /** Had any U.S. or foreign income during the year (engagement scoping). */
  hadIncome: boolean;
}

export interface SubstantialPresenceResult {
  days2025: number;
  /** 1/3 of 2024 days, rounded down per IRS worksheet convention. */
  weighted2024: number;
  /** 1/6 of 2023 days. */
  weighted2023: number;
  weightedTotal: number;
  /** Meets the raw SPT counting ALL days (before exempt-day exclusion). */
  meetsTestBeforeExclusion: boolean;
  /** Plain-language explanation. */
  explanation: string;
}

/**
 * Substantial Presence Test (IRC §7701(b); Form 8843 instructions).
 *
 * A person meets the SPT for 2025 if BOTH:
 *   • present ≥ 31 days in 2025, AND
 *   • days2025 + days2024/3 + days2023/6 ≥ 183
 *
 * This computes the test counting *all* physical-presence days. The whole point
 * of Form 8843 is that an exempt individual EXCLUDES days, so an F-1 student who
 * meets this raw test still files as a nonresident by excluding exempt days
 * (line 4b).
 */
export function computeSubstantialPresence(
  days2025: number,
  days2024: number,
  days2023: number,
): SubstantialPresenceResult {
  const weighted2024 = Math.floor(days2024 / 3);
  const weighted2023 = Math.floor(days2023 / 6);
  const weightedTotal = days2025 + weighted2024 + weighted2023;
  const meetsTestBeforeExclusion = days2025 >= 31 && weightedTotal >= 183;

  const explanation = meetsTestBeforeExclusion
    ? `Counting every day of physical presence, the weighted total is ${weightedTotal} ` +
      `(${days2025} + ${weighted2024} + ${weighted2023}), which is ≥ 183 with ≥ 31 days in ${TAX_YEAR}. ` +
      `This is exactly why Form 8843 is needed: as an exempt individual you exclude your exempt ` +
      `days (line 4b) so you remain a nonresident alien for tax purposes.`
    : `The weighted total is ${weightedTotal} (${days2025} + ${weighted2024} + ${weighted2023}), ` +
      `below the 183-day threshold. You do not meet the Substantial Presence Test even before ` +
      `excluding exempt days, so you are a nonresident alien; Form 8843 documents your exempt status.`;

  return {
    days2025,
    weighted2024,
    weighted2023,
    weightedTotal,
    meetsTestBeforeExclusion,
    explanation,
  };
}

/** Visa types that make a STUDENT an exempt individual. */
const STUDENT_VISAS: VisaType[] = ["F", "J", "M", "Q"];
/** Visa types that make a TEACHER/TRAINEE an exempt individual. */
const TEACHER_VISAS: VisaType[] = ["J", "Q"];

/**
 * Count calendar years (2019–2025) in which the person was an exempt individual.
 *
 * Per the instructions, ANY part of a calendar year counts as a full year, and
 * the 2025 current year counts too. Students are limited to 5 such years before
 * the closer-connection facts-and-circumstances test kicks in (line 12).
 */
export function countExemptYears(
  visaHistory: Record<number, VisaType>,
  category: FilingCategory,
): { years: number[]; count: number } {
  const relevant = category === "teacher_trainee" ? TEACHER_VISAS : STUDENT_VISAS;
  const years: number[] = [];
  for (let y = 2019; y <= TAX_YEAR; y++) {
    const v = visaHistory[y];
    if (v && relevant.includes(v)) years.push(y);
  }
  return { years, count: years.length };
}

export interface ExemptStatusResult {
  /** Were you exempt as student/teacher/trainee for MORE than 5 years? (line 12) */
  exemptMoreThanFiveYears: boolean;
  /** Were you exempt for any part of 2 of the preceding 6 years? (line 8, teachers) */
  exemptTwoOfSixYears: boolean;
  exemptYears: number[];
  exemptYearCount: number;
  /** Days the person may exclude on line 4b (all 2025 days, when exempt all year). */
  recommendedLine4b: number;
  warnings: string[];
}

/**
 * Derive the line 8 / 12 answers and surface the common-mistake warnings the
 * advisor should review before signing.
 */
export function evaluateExemptStatus(input: Form8843Input): ExemptStatusResult {
  const { years, count } = countExemptYears(input.visaHistory, input.filingCategory);
  const warnings: string[] = [];

  // Students: limited to 5 calendar years; teachers: 2-of-6-prior-years rule.
  const exemptMoreThanFiveYears = input.filingCategory === "student" && count > 5;

  const priorExemptYears = years.filter((y) => y <= 2024).length;
  const exemptTwoOfSixYears =
    input.filingCategory === "teacher_trainee" && priorExemptYears >= 2;

  if (exemptMoreThanFiveYears) {
    warnings.push(
      "Exempt as a student for more than 5 calendar years — line 12 should be 'Yes' and you must " +
        "attach a statement establishing you do not intend to reside permanently in the U.S.",
    );
  }
  if (input.appliedForGreenCard) {
    warnings.push(
      "Line 13 is 'Yes' (steps toward permanent residence). This can defeat the exemption — review " +
        "closer-connection facts and explain on line 14.",
    );
  }
  if (input.hadIncome) {
    warnings.push(
      "Client indicated U.S. or foreign income. Form 8843 alone may be insufficient — a Form 1040-NR " +
        "engagement may be required (per the engagement letter scope).",
    );
  }
  if (input.daysPresent[2025] > 0 && input.filingCategory === "other") {
    warnings.push(
      "Filing category is 'other' — confirm the individual is actually an exempt individual (F/J/M/Q " +
        "student or J/Q teacher/trainee) who must file Form 8843.",
    );
  }

  // When exempt for the whole year, every 2025 day is excludable on line 4b.
  const recommendedLine4b = input.daysPresent[2025];

  return {
    exemptMoreThanFiveYears,
    exemptTwoOfSixYears,
    exemptYears: years,
    exemptYearCount: count,
    recommendedLine4b,
    warnings,
  };
}

/** Mailing address for a standalone Form 8843 (no Form 1040-NR attached). */
export const IRS_MAILING_ADDRESS = [
  "Department of the Treasury",
  "Internal Revenue Service Center",
  "Austin, TX 73301-0215",
];

/** Inclusive day count between two ISO dates (both endpoints counted). */
export function daysBetweenInclusive(fromISO: string, toISO: string): number {
  const from = new Date(fromISO + "T00:00:00Z");
  const to = new Date(toISO + "T00:00:00Z");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  const ms = to.getTime() - from.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / 86_400_000) + 1;
}

/** Sum presence days across the 2025 visa-timeline segments. */
export function sumTimelineDays(timeline: VisaSegment[]): number {
  return timeline.reduce((acc, seg) => acc + daysBetweenInclusive(seg.from, seg.to), 0);
}

/**
 * Validation: returns a list of human-readable problems. Empty = ready for
 * advisor review. This mirrors the "Final Checklist" the advisor uses.
 */
export function validateForm8843(input: Form8843Input): string[] {
  const errors: string[] = [];
  if (!input.personal.firstName.trim()) errors.push("First name is required.");
  if (!input.personal.lastName.trim()) errors.push("Last name is required.");
  if (!input.personal.countryOfCitizenship.trim())
    errors.push("Country of citizenship is required.");
  if (!input.currentVisaType.trim()) errors.push("Line 1a: current visa type is required.");
  if (!input.mostRecentEntryDate) errors.push("Line 1a: most recent U.S. entry date is required.");
  if (input.daysPresent[2025] < 0 || input.daysPresent[2025] > 366)
    errors.push("Line 4a: 2025 days present must be between 0 and 366.");
  if (input.filingCategory === "student" && !input.institution.name.trim())
    errors.push("Part III line 9: academic institution name is required for students.");
  if (input.appliedForGreenCard && !input.greenCardExplanation?.trim())
    errors.push("Line 14: an explanation is required when line 13 is 'Yes'.");
  return errors;
}
