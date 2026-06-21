/**
 * Form 8843 PDF generation (server-only — uses the filesystem and pdf-lib).
 *
 * We overlay the prepared values onto the OFFICIAL IRS Form 8843 (2025) so the
 * output is a real, fileable form. The blank form is a U.S. government work
 * (public domain) stored at public/forms/f8843-2025.pdf. When the client's visa
 * status changed during the year we also append a clean "Visa Status Statement"
 * page, as the instructions allow.
 *
 * Field coordinates are in PDF points (origin bottom-left) measured against the
 * official 2025 layout. The advisor reviews every generated form before signing.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import {
  evaluateExemptStatus,
  IRS_MAILING_ADDRESS,
  TAX_YEAR,
  type Form8843Input,
} from "@/lib/form8843";

const BLANK_FORM_PATH = path.join(process.cwd(), "public", "forms", "f8843-2025.pdf");

/**
 * Page-1 field coordinates (x, y) in PDF points, origin bottom-left.
 * Measured against the official 2025 layout via pdfplumber word extraction and
 * verified by rendering the filled form. See README "How the form is filled".
 */
const P1 = {
  firstName: [40, 675],
  lastName: [248, 675],
  taxpayerId: [442, 675],
  addrResidence: [120, 640],
  addrUS: [402, 640],
  line1a: [420, 589],
  line1b: [508, 571],
  line2: [342, 553],
  line3a: [270, 540],
  line3b: [194, 529],
  days2025: [95, 505],
  days2024: [180, 505],
  days2023: [265, 505],
  line4b: [498, 493],
  // Part III — Students
  line9: [150, 278],
  line10: [150, 232],
  // line 11 visa history grid (two rows)
  v2019: [348, 205],
  v2020: [442, 205],
  v2021: [89, 193],
  v2022: [175, 193],
  v2023: [262, 193],
  v2024: [348, 193],
  // Yes/No checkboxes (X mark): [yesX, noX]
  line12Yes: [510, 169],
  line12No: [546, 169],
  line13Yes: [510, 109],
  line13No: [546, 109],
  line14: [150, 84],
} as const;

/** Page-2 signature coordinates. */
const P2 = {
  signature: [140, 202],
  signDate: [485, 202],
} as const;

function draw(page: PDFPage, font: PDFFont, text: string, xy: readonly [number, number] | number[], size = 9) {
  if (!text) return;
  page.drawText(text, { x: xy[0], y: xy[1], size, font, color: rgb(0.06, 0.09, 0.16) });
}

/** Multi-line draw for address/institution blocks. */
function drawBlock(page: PDFPage, font: PDFFont, text: string, x: number, yTop: number, size = 8, lineGap = 10) {
  const lines = text.split("\n").flatMap((l) => wrap(l, 46));
  lines.forEach((line, i) => page.drawText(line, { x, y: yTop - i * lineGap, size, font, color: rgb(0.06, 0.09, 0.16) }));
}

function wrap(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const words = text.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) out.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) out.push(cur);
  return out;
}

function institutionText(i: { name: string; address: string; phone: string }): string {
  return [i.name, i.address, i.phone].filter(Boolean).join("\n");
}

/**
 * Build the filled Form 8843 PDF and return its bytes.
 * @param signed when true, types the taxpayer's name on the signature line and
 *        stamps today's date (a typed signature placeholder for review; the
 *        client still prints and signs by hand before mailing).
 */
export async function generateForm8843(input: Form8843Input, signed = false): Promise<Uint8Array> {
  const blank = await readFile(BLANK_FORM_PATH);
  const pdf = await PDFDocument.load(blank);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const [page1, page2] = pdf.getPages();
  const exempt = evaluateExemptStatus(input);

  // Header
  draw(page1, font, `${input.personal.firstName} ${input.personal.middleInitial}`.trim(), P1.firstName, 10);
  draw(page1, font, input.personal.lastName, P1.lastName, 10);
  draw(page1, font, input.personal.taxpayerId, P1.taxpayerId, 10);
  drawBlock(page1, font, input.personal.addressInCountryOfResidence, P1.addrResidence[0], P1.addrResidence[1]);
  drawBlock(page1, font, input.personal.addressInUnitedStates, P1.addrUS[0], P1.addrUS[1]);

  // Part I — General Information
  const entry = input.mostRecentEntryDate ? formatDate(input.mostRecentEntryDate) : "";
  draw(page1, font, [input.currentVisaType, entry].filter(Boolean).join(", "), P1.line1a);
  const line1b = input.statusChange
    ? `${input.currentStatusEndOfYear} (changed ${formatDate(input.statusChange.dateOfChange)}; prev ${input.statusChange.previousStatus})`
    : input.currentStatusEndOfYear || input.currentVisaType;
  draw(page1, font, line1b, P1.line1b);
  draw(page1, font, input.personal.countryOfCitizenship, P1.line2);
  draw(page1, font, input.personal.passportCountry, P1.line3a);
  draw(page1, font, input.personal.passportNumber, P1.line3b);

  // Line 4a / 4b
  draw(page1, font, String(input.daysPresent[2025]), P1.days2025);
  draw(page1, font, String(input.daysPresent[2024]), P1.days2024);
  draw(page1, font, String(input.daysPresent[2023]), P1.days2023);
  draw(page1, font, String(exempt.recommendedLine4b), P1.line4b);

  // Part III — Students (the common case for F-1)
  if (input.filingCategory === "student") {
    drawBlock(page1, font, institutionText(input.institution), P1.line9[0], P1.line9[1], 8, 9);
    drawBlock(page1, font, institutionText(input.director), P1.line10[0], P1.line10[1], 8, 9);
    const vh = input.visaHistory;
    const vt = (y: number) => (vh[y] && vh[y] !== "None" ? vh[y] : "N/A");
    draw(page1, font, vt(2019), P1.v2019);
    draw(page1, font, vt(2020), P1.v2020);
    draw(page1, font, vt(2021), P1.v2021);
    draw(page1, font, vt(2022), P1.v2022);
    draw(page1, font, vt(2023), P1.v2023);
    draw(page1, font, vt(2024), P1.v2024);
    // Line 12 — exempt > 5 years?
    draw(page1, bold, "X", exempt.exemptMoreThanFiveYears ? P1.line12Yes : P1.line12No, 10);
    // Line 13 — green card steps?
    draw(page1, bold, "X", input.appliedForGreenCard ? P1.line13Yes : P1.line13No, 10);
    if (input.appliedForGreenCard && input.greenCardExplanation) {
      draw(page1, font, input.greenCardExplanation.slice(0, 90), P1.line14, 8);
    }
  }

  // Page 2 — signature (typed placeholder for review only)
  if (signed) {
    draw(page2, font, `${input.personal.firstName} ${input.personal.lastName}`, P2.signature, 11);
    draw(page2, font, formatDate(new Date().toISOString().slice(0, 10)), P2.signDate, 11);
  }

  // The official PDF carries two instruction pages after the form. The filer
  // only mails the form, so drop them — keep just the two fileable pages.
  for (let i = pdf.getPageCount() - 1; i >= 2; i--) pdf.removePage(i);

  // Optional attachment: visa-status statement when status changed mid-year.
  if (shouldAttachStatement(input)) {
    appendVisaStatement(pdf, font, bold, input);
  }

  return pdf.save();
}

function shouldAttachStatement(input: Form8843Input): boolean {
  return input.visaTimeline.length > 1 || Boolean(input.statusChange);
}

function appendVisaStatement(pdf: PDFDocument, font: PDFFont, bold: PDFFont, input: Form8843Input) {
  const page = pdf.addPage([612, 792]);
  const left = 64;
  let y = 720;
  const line = (t: string, f = font, size = 11, gap = 16) => {
    page.drawText(t, { x: left, y, size, font: f, color: rgb(0.06, 0.09, 0.16) });
    y -= gap;
  };
  line("Statement of Visa Status", bold, 16, 26);
  line(`Attachment to Form ${"8843"} — Tax Year ${TAX_YEAR}`, font, 11, 22);
  line(`Taxpayer: ${input.personal.firstName} ${input.personal.lastName}`, font, 11, 14);
  line(
    input.personal.taxpayerId ? `Taxpayer ID: ${input.personal.taxpayerId}` : "Taxpayer ID: (none)",
    font,
    11,
    26,
  );
  line(
    `The taxpayer was present in the United States under multiple visa classifications`,
    font,
    11,
    14,
  );
  line(`during the ${TAX_YEAR} tax year. The visa history is as follows:`, font, 11, 22);
  for (const seg of input.visaTimeline) {
    line(`• ${seg.status}: ${formatDate(seg.from)} – ${formatDate(seg.to)}${seg.note ? ` (${seg.note})` : ""}`, font, 11, 16);
  }
  y -= 10;
  line("Mail the signed Form 8843 (with this statement) to:", bold, 11, 16);
  for (const l of IRS_MAILING_ADDRESS) line(`    ${l}`, font, 11, 14);
}

function formatDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}
