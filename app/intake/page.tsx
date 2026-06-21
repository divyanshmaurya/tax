"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  computeSubstantialPresence,
  evaluateExemptStatus,
  validateForm8843,
  type FilingCategory,
  type Form8843Input,
  type VisaSegment,
  type VisaType,
} from "@/lib/form8843";
import { SAMPLE_INPUT } from "@/lib/sample";

const STORAGE_KEY = "form8843_intake";
const VISA_OPTIONS: VisaType[] = ["None", "F", "J", "M", "Q", "G", "B", "H", "A", "Other"];
const HISTORY_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

function emptyInput(): Form8843Input {
  return {
    personal: {
      firstName: "",
      middleInitial: "",
      lastName: "",
      taxpayerId: "",
      countryOfCitizenship: "",
      passportCountry: "",
      passportNumber: "",
      addressInCountryOfResidence: "",
      addressInUnitedStates: "",
    },
    filingCategory: "student",
    currentVisaType: "F-1",
    mostRecentEntryDate: "",
    currentStatusEndOfYear: "F-1",
    daysPresent: { 2025: 0, 2024: 0, 2023: 0 },
    visaHistory: { 2019: "None", 2020: "None", 2021: "None", 2022: "None", 2023: "None", 2024: "None", 2025: "F" },
    institution: { name: "", address: "", phone: "" },
    director: { name: "", address: "", phone: "" },
    appliedForGreenCard: false,
    greenCardExplanation: "",
    visaTimeline: [],
    hadIncome: false,
  };
}

export default function IntakePage() {
  const [data, setData] = useState<Form8843Input>(emptyInput);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spt = useMemo(
    () => computeSubstantialPresence(data.daysPresent[2025], data.daysPresent[2024], data.daysPresent[2023]),
    [data.daysPresent],
  );
  const exempt = useMemo(() => evaluateExemptStatus(data), [data]);
  const problems = useMemo(() => validateForm8843(data), [data]);

  function patch(updater: (d: Form8843Input) => void) {
    setData((prev) => {
      const next = structuredClone(prev);
      updater(next);
      return next;
    });
    setSaved(false);
  }

  function saveForAssistant() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaved(true);
    } catch {
      setError("Couldn't save locally (storage blocked).");
    }
  }

  async function generate(signed: boolean) {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/form8843", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: data, signed }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to generate the form.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Form8843-${data.personal.lastName || "draft"}-2025.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate the form.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="container-page py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip bg-[var(--color-brand-soft)] text-[var(--color-brand)]">Intake &amp; Form</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Information Request Checklist</h1>
          <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
            Provide the details from your passport and I-20. The calculator updates live; when you&rsquo;re
            ready, generate the official Form 8843 to print, sign, and mail.
          </p>
        </div>
        <button onClick={() => setData(SAMPLE_INPUT)} className="btn-ghost">
          Load sample data
        </button>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* FORM */}
        <div className="space-y-6">
          <Section title="Personal information">
            <Grid>
              <Field label="First name & initial">
                <input className="input" value={data.personal.firstName}
                  onChange={(e) => patch((d) => { d.personal.firstName = e.target.value; })} />
              </Field>
              <Field label="Middle initial">
                <input className="input" maxLength={2} value={data.personal.middleInitial}
                  onChange={(e) => patch((d) => { d.personal.middleInitial = e.target.value; })} />
              </Field>
              <Field label="Last name">
                <input className="input" value={data.personal.lastName}
                  onChange={(e) => patch((d) => { d.personal.lastName = e.target.value; })} />
              </Field>
              <Field label="U.S. taxpayer ID (SSN/ITIN), if any">
                <input className="input" placeholder="optional" value={data.personal.taxpayerId}
                  onChange={(e) => patch((d) => { d.personal.taxpayerId = e.target.value; })} />
              </Field>
              <Field label="Country of citizenship">
                <input className="input" value={data.personal.countryOfCitizenship}
                  onChange={(e) => patch((d) => { d.personal.countryOfCitizenship = e.target.value; })} />
              </Field>
              <Field label="Passport country">
                <input className="input" value={data.personal.passportCountry}
                  onChange={(e) => patch((d) => { d.personal.passportCountry = e.target.value; })} />
              </Field>
              <Field label="Passport number">
                <input className="input" value={data.personal.passportNumber}
                  onChange={(e) => patch((d) => { d.personal.passportNumber = e.target.value; })} />
              </Field>
            </Grid>
            <Grid>
              <Field label="Home address (outside U.S.)">
                <input className="input" value={data.personal.addressInCountryOfResidence}
                  onChange={(e) => patch((d) => { d.personal.addressInCountryOfResidence = e.target.value; })} />
              </Field>
              <Field label="Current U.S. address">
                <input className="input" value={data.personal.addressInUnitedStates}
                  onChange={(e) => patch((d) => { d.personal.addressInUnitedStates = e.target.value; })} />
              </Field>
            </Grid>
          </Section>

          <Section title="Visa & status (Part I)">
            <Grid>
              <Field label="Filing category">
                <select className="input" value={data.filingCategory}
                  onChange={(e) => patch((d) => { d.filingCategory = e.target.value as FilingCategory; })}>
                  <option value="student">Student (F/J/M/Q) — Part III</option>
                  <option value="teacher_trainee">Teacher / Trainee (J/Q) — Part II</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Line 1a — current visa type">
                <input className="input" placeholder="e.g. F-1" value={data.currentVisaType}
                  onChange={(e) => patch((d) => { d.currentVisaType = e.target.value; })} />
              </Field>
              <Field label="Line 1a — most recent U.S. entry date">
                <input type="date" className="input" value={data.mostRecentEntryDate}
                  onChange={(e) => patch((d) => { d.mostRecentEntryDate = e.target.value; })} />
              </Field>
              <Field label="Line 1b — status on Dec 31, 2025">
                <input className="input" placeholder="e.g. F-1" value={data.currentStatusEndOfYear}
                  onChange={(e) => patch((d) => { d.currentStatusEndOfYear = e.target.value; })} />
              </Field>
            </Grid>
          </Section>

          <Section title="Days present in the U.S. (Line 4a)">
            <Grid>
              {([2025, 2024, 2023] as const).map((y) => (
                <Field key={y} label={`Days in ${y}`}>
                  <input type="number" min={0} max={366} className="input" value={data.daysPresent[y]}
                    onChange={(e) => patch((d) => { d.daysPresent[y] = clampDays(e.target.value); })} />
                </Field>
              ))}
            </Grid>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Count every day you were physically present in the U.S. The calculator excludes your exempt
              days automatically for line 4b.
            </p>
          </Section>

          <Section title="Visa history (Lines 7 / 11)">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {HISTORY_YEARS.map((y) => (
                <Field key={y} label={String(y)}>
                  <select className="input" value={data.visaHistory[y]}
                    onChange={(e) => patch((d) => { d.visaHistory[y] = e.target.value as VisaType; })}>
                    {VISA_OPTIONS.map((v) => <option key={v} value={v}>{v === "None" ? "N/A" : v}</option>)}
                  </select>
                </Field>
              ))}
            </div>
          </Section>

          <Section title={data.filingCategory === "teacher_trainee" ? "Program (Part II)" : "Academic institution (Part III)"}>
            <Grid>
              <Field label="Institution / program name (line 9 / 5)">
                <input className="input" value={data.institution.name}
                  onChange={(e) => patch((d) => { d.institution.name = e.target.value; })} />
              </Field>
              <Field label="Institution phone">
                <input className="input" value={data.institution.phone}
                  onChange={(e) => patch((d) => { d.institution.phone = e.target.value; })} />
              </Field>
              <Field label="Institution address">
                <input className="input" value={data.institution.address}
                  onChange={(e) => patch((d) => { d.institution.address = e.target.value; })} />
              </Field>
            </Grid>
            <Grid>
              <Field label="Director / DSO name (line 10 / 6)">
                <input className="input" value={data.director.name}
                  onChange={(e) => patch((d) => { d.director.name = e.target.value; })} />
              </Field>
              <Field label="Director phone">
                <input className="input" value={data.director.phone}
                  onChange={(e) => patch((d) => { d.director.phone = e.target.value; })} />
              </Field>
              <Field label="Director address">
                <input className="input" value={data.director.address}
                  onChange={(e) => patch((d) => { d.director.address = e.target.value; })} />
              </Field>
            </Grid>
          </Section>

          <Section title="Other questions">
            <div className="space-y-3">
              <Toggle
                label="Did you apply for, or take steps toward, a U.S. green card in 2025? (Line 13)"
                checked={data.appliedForGreenCard}
                onChange={(v) => patch((d) => { d.appliedForGreenCard = v; })}
              />
              {data.appliedForGreenCard && (
                <Field label="Line 14 — explanation">
                  <input className="input" value={data.greenCardExplanation ?? ""}
                    onChange={(e) => patch((d) => { d.greenCardExplanation = e.target.value; })} />
                </Field>
              )}
              <Toggle
                label="Did you have any U.S. or foreign income during the year?"
                checked={data.hadIncome}
                onChange={(v) => patch((d) => { d.hadIncome = v; })}
              />
            </div>
          </Section>

          <VisaTimeline
            timeline={data.visaTimeline}
            onAdd={() => patch((d) => { d.visaTimeline.push({ status: "", from: "", to: "" }); })}
            onChange={(i, seg) => patch((d) => { d.visaTimeline[i] = seg; })}
            onRemove={(i) => patch((d) => { d.visaTimeline.splice(i, 1); })}
          />
        </div>

        {/* SIDEBAR — live results */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <h2 className="text-sm font-bold">Substantial Presence Test</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Stat label="2025" value={spt.days2025} />
              <Stat label="2024 ÷3" value={spt.weighted2024} />
              <Stat label="2023 ÷6" value={spt.weighted2023} />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--color-canvas)] px-3 py-2 text-sm">
              <span className="text-[var(--color-muted)]">Weighted total</span>
              <span className="font-bold">{spt.weightedTotal} / 183</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">{spt.explanation}</p>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-bold">Exempt status</h2>
            <Row k="Exempt calendar years" v={`${exempt.exemptYearCount}${exempt.exemptYears.length ? ` (${exempt.exemptYears.join(", ")})` : ""}`} />
            <Row k="Recommended line 4b" v={String(exempt.recommendedLine4b)} />
            <Row k="Line 12 (exempt > 5 yrs)" v={exempt.exemptMoreThanFiveYears ? "Yes" : "No"} />
            <Row k="Line 13 (green card)" v={data.appliedForGreenCard ? "Yes" : "No"} />
            {exempt.warnings.length > 0 && (
              <ul className="mt-3 space-y-2 rounded-lg bg-[var(--color-warn-soft)] p-3 text-xs text-[var(--color-warn)]">
                {exempt.warnings.map((w) => <li key={w}>⚠ {w}</li>)}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-bold">Generate</h2>
            {problems.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-[var(--color-muted)]">
                {problems.map((p) => <li key={p}>• {p}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-[var(--color-accent)]">Ready for review — all required fields complete.</p>
            )}
            <div className="mt-4 grid gap-2">
              <button onClick={() => generate(false)} disabled={generating} className="btn-primary">
                {generating ? "Generating…" : "Download Form 8843 (PDF)"}
              </button>
              <button onClick={() => generate(true)} disabled={generating} className="btn-ghost">
                Download signed draft
              </button>
              <button onClick={saveForAssistant} className="btn-ghost">
                {saved ? "Saved ✓ — open assistant" : "Save for the AI assistant"}
              </button>
              {saved && (
                <Link href="/assistant" className="text-center text-xs font-semibold text-[var(--color-brand)] hover:underline">
                  Go to the assistant →
                </Link>
              )}
            </div>
            {error && <p className="mt-3 text-xs text-[var(--color-warn)]">{error}</p>}
            <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-muted)]">
              Generates the official 2025 form, filled in. Print, sign by hand, and mail. The advisor
              reviews before filing. Your data stays in your browser unless you choose to share it.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- small presentational helpers ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[var(--color-line)] text-[var(--color-brand)]" />
      <span className="text-[var(--color-ink)]">{label}</span>
    </label>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[var(--color-canvas)] py-2">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px] text-[var(--color-muted)]">{label}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
      <span className="text-[var(--color-muted)]">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}

function clampDays(value: string): number {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(366, Math.round(n)));
}

function VisaTimeline({
  timeline,
  onAdd,
  onChange,
  onRemove,
}: {
  timeline: VisaSegment[];
  onAdd: () => void;
  onChange: (i: number, seg: VisaSegment) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Visa timeline (optional)</h2>
        <button onClick={onAdd} className="btn-ghost px-3 py-1.5 text-xs">+ Add status</button>
      </div>
      <p className="mt-1 text-xs text-[var(--color-muted)]">
        Add a row for each status if your visa changed during the year. We&rsquo;ll attach a clean
        visa-status statement to your Form 8843.
      </p>
      {timeline.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-muted)]">No status changes added.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {timeline.map((seg, i) => (
            <div key={i} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Field label="Status">
                <input className="input" placeholder="e.g. F-1" value={seg.status}
                  onChange={(e) => onChange(i, { ...seg, status: e.target.value })} />
              </Field>
              <Field label="From">
                <input type="date" className="input" value={seg.from}
                  onChange={(e) => onChange(i, { ...seg, from: e.target.value })} />
              </Field>
              <Field label="To">
                <input type="date" className="input" value={seg.to}
                  onChange={(e) => onChange(i, { ...seg, to: e.target.value })} />
              </Field>
              <button onClick={() => onRemove(i)} className="btn-ghost mb-0.5 px-3 py-2 text-xs">Remove</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
