"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import {
  GIG_PRIORITIES,
  GIG_WORK_TYPES,
  type GigPriority,
  type GigWorkType,
} from "@superfinz/shared";
import { Logo } from "@/components/ui/logo";

const labels: Record<string, string> = {
  DELIVERY: "Delivery",
  RIDE_HAILING: "Ride-hailing",
  HOME_SERVICES: "Home services",
  FREELANCE: "Freelance",
  STREET_VENDING: "Street vending",
  DAILY_WAGE: "Daily wage",
  DOMESTIC_WORK: "Domestic work",
  OTHER: "Other",
  STABLE_WEEKLY_SPENDING: "Stable weekly spending",
  EMERGENCY_CUSHION: "Emergency cushion",
  UPCOMING_BILLS: "Upcoming bills",
  WORK_EXPENSES: "Work expenses",
  AVOIDING_DEBT: "Avoiding debt",
};
const spendingCategories = [
  "Rent / home",
  "Food",
  "Transport / fuel",
  "Family support",
  "Utilities",
  "Personal spending",
] as const;
const dateValue = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
const initial = {
  name: "",
  city: "Chennai",
  language: "English",
  workTypes: ["DELIVERY"] as GigWorkType[],
  priority: "STABLE_WEEKLY_SPENDING" as GigPriority,
  source: "Primary platform",
  low: "4000",
  typical: "6000",
  good: "8000",
  payout: dateValue(3),
  workDays: "6",
  deduction: "10",
  workCosts: "1200",
  balance: "6800",
  cushion: "600",
  buffer: "600",
  commitment: "Rent",
  commitmentAmount: "4000",
  due: dateValue(8),
  essentials: "55",
  work: "15",
  emergency: "10",
  longTerm: "5",
  flexible: "15",
  trackingMode: "START_NOW" as "START_NOW" | "OBSERVE_LEARN",
  essentialCategories: ["Rent / home", "Food"] as string[],
  flexibleCategories: ["Personal spending"] as string[],
  hardestToProtect: "",
  confirmed: false,
};
type Form = typeof initial;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(initial);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    const raw = window.localStorage.getItem("superfinz-onboarding-v3");
    if (raw) {
      try {
        setForm({ ...initial, ...(JSON.parse(raw) as Partial<Form>) });
      } catch {
        /* ignore invalid local draft */
      }
    } else if (session?.user?.name)
      set("name", session.user.name.split(" ")[0] ?? session.user.name);
    setReady(true);
  }, [session?.user?.name]);
  useEffect(() => {
    if (ready)
      window.localStorage.setItem(
        "superfinz-onboarding-v3",
        JSON.stringify(form),
      );
  }, [form, ready]);
  const toggleWork = (value: GigWorkType) =>
    set(
      "workTypes",
      form.workTypes.includes(value)
        ? form.workTypes.filter((item) => item !== value)
        : [...form.workTypes, value],
    );
  const splitTotal =
    Number(form.essentials) +
    Number(form.work) +
    Number(form.emergency) +
    Number(form.longTerm) +
    Number(form.flexible);
  const incomeValid =
    Number(form.low) >= 0 &&
    Number(form.low) <= Number(form.typical) &&
    Number(form.typical) <= Number(form.good) &&
    Number(form.typical) > 0;
  const valid = [
    Boolean(form.name.trim() && form.city.trim() && form.workTypes.length),
    Boolean(form.source.trim() && incomeValid),
    Number(form.workDays) >= 1 &&
      Number(form.workDays) <= 7 &&
      Number(form.balance) >= 0,
    Boolean(form.commitment.trim() && Number(form.commitmentAmount) > 0),
    Boolean(form.trackingMode),
    splitTotal === 100 && form.confirmed,
  ][step];
  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/gig/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredName: form.name.trim(),
          city: form.city.trim(),
          preferredLanguage: form.language,
          workTypes: form.workTypes,
          primaryPriority: form.priority,
          lowWeekIncome: Number(form.low),
          typicalWeekIncome: Number(form.typical),
          goodWeekIncome: Number(form.good),
          workDaysPerWeek: Number(form.workDays),
          platformDeductionRate: Number(form.deduction),
          weeklyWorkCosts: Number(form.workCosts),
          openingBalance: Number(form.balance),
          currentCushion: Number(form.cushion),
          safetyBuffer: Number(form.buffer),
          cushionTargetDays: 30,
          sources: [
            {
              name: form.source.trim(),
              type: "PLATFORM_PAYOUT",
              frequency: "WEEKLY",
              typicalMin: Number(form.low),
              typicalMax: Number(form.good),
              nextPayoutAt: new Date(`${form.payout}T12:00:00`).toISOString(),
              connectionMode: "MANUAL",
              prototype: true,
            },
          ],
          commitments: [
            {
              title: form.commitment.trim(),
              category: form.commitment.trim(),
              amount: Number(form.commitmentAmount),
              dueDate: new Date(`${form.due}T12:00:00`).toISOString(),
              recurrence: "MONTHLY",
              essential: true,
              priority: 1,
              autopay: false,
            },
          ],
          splitRule: {
            essentialsPct: Number(form.essentials),
            workCostsPct: Number(form.work),
            emergencyPct: Number(form.emergency),
            longTermPct: Number(form.longTerm),
            flexiblePct: Number(form.flexible),
            enabled: true,
          },
          trackingMode: form.trackingMode,
          spendingProfile: {
            essentialCategories: form.essentialCategories,
            flexibleCategories: form.flexibleCategories,
            hardestToProtect: form.hardestToProtect.trim() || null,
          },
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(body.error ?? "Could not save your plan");
      window.localStorage.removeItem("superfinz-onboarding-v3");
      await update({ onboarded: true });
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Check your details and try again",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="min-h-dvh bg-paper px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="font-black">SUPERFINZ</span>
          </div>
          <span className="brut-stamp bg-accent-soft">Step {step + 1} / 6</span>
        </div>
        <div
          className="mt-5 h-3 border-2 border-ink bg-paper-2"
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuemin={1}
          aria-valuemax={6}
          aria-valuenow={step + 1}
        >
          <div
            className="h-full bg-accent transition-[width] duration-200 motion-reduce:transition-none"
            style={{ width: `${(step + 1) * 100 / 6}%` }}
          />
        </div>
        <section className="mt-7 brut-card-lg p-5 sm:p-8">
          {step === 0 && (
            <>
              <Eyebrow>Work profile</Eyebrow>
              <Title>Tell us how you earn.</Title>
              <Copy>
                Your work pattern—not a salary assumption—will shape the plan.
              </Copy>
              <div className="mt-7 grid gap-5">
                <Field
                  label="Preferred name"
                  value={form.name}
                  onChange={(value) => set("name", value)}
                />
                <Field
                  label="City"
                  value={form.city}
                  onChange={(value) => set("city", value)}
                />
                <Field
                  label="Preferred language"
                  value={form.language}
                  onChange={(value) => set("language", value)}
                />
                <ChoiceGroup label="Work types">
                  {GIG_WORK_TYPES.map((value) => (
                    <Choice
                      key={value}
                      selected={form.workTypes.includes(value)}
                      onClick={() => toggleWork(value)}
                    >
                      {labels[value]}
                    </Choice>
                  ))}
                </ChoiceGroup>
                <ChoiceGroup label="Main priority">
                  {GIG_PRIORITIES.map((value) => (
                    <Choice
                      key={value}
                      selected={form.priority === value}
                      onClick={() => set("priority", value)}
                    >
                      {labels[value]}
                    </Choice>
                  ))}
                </ChoiceGroup>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <Eyebrow>Income range</Eyebrow>
              <Title>Map the low and good weeks.</Title>
              <Copy>
                Future gig income is an estimate, so SuperFinz shows ranges
                instead of promises.
              </Copy>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Income source"
                  value={form.source}
                  onChange={(value) => set("source", value)}
                  className="sm:col-span-2"
                />
                <Field
                  label="Low-week earnings"
                  value={form.low}
                  onChange={(value) => set("low", value)}
                  type="number"
                />
                <Field
                  label="Typical-week earnings"
                  value={form.typical}
                  onChange={(value) => set("typical", value)}
                  type="number"
                />
                <Field
                  label="Good-week earnings"
                  value={form.good}
                  onChange={(value) => set("good", value)}
                  type="number"
                />
                <Field
                  label="Next expected payout"
                  value={form.payout}
                  onChange={(value) => set("payout", value)}
                  type="date"
                />
                {!incomeValid && (
                  <p
                    role="alert"
                    className="sm:col-span-2 border-2 border-bad bg-bad-soft p-3 text-sm font-bold text-bad"
                  >
                    Use a realistic low ≤ typical ≤ good range.
                  </p>
                )}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <Eyebrow>True take-home</Eyebrow>
              <Title>Protect the cost of working.</Title>
              <Copy>
                Fuel, deductions, and maintenance reduce what is actually
                available to the household.
              </Copy>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Workdays each week"
                  value={form.workDays}
                  onChange={(value) => set("workDays", value)}
                  type="number"
                />
                <Field
                  label="Platform deductions (%)"
                  value={form.deduction}
                  onChange={(value) => set("deduction", value)}
                  type="number"
                />
                <Field
                  label="Weekly work costs"
                  value={form.workCosts}
                  onChange={(value) => set("workCosts", value)}
                  type="number"
                />
                <Field
                  label="Current available balance"
                  value={form.balance}
                  onChange={(value) => set("balance", value)}
                  type="number"
                />
                <Field
                  label="Current emergency cushion"
                  value={form.cushion}
                  onChange={(value) => set("cushion", value)}
                  type="number"
                />
                <Field
                  label="Minimum safety buffer"
                  value={form.buffer}
                  onChange={(value) => set("buffer", value)}
                  type="number"
                />
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <Eyebrow>Commitments</Eyebrow>
              <Title>Add the next essential.</Title>
              <Copy>
                Fixed commitments are protected before SuperFinz releases
                flexible money.
              </Copy>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Commitment"
                  value={form.commitment}
                  onChange={(value) => set("commitment", value)}
                />
                <Field
                  label="Amount"
                  value={form.commitmentAmount}
                  onChange={(value) => set("commitmentAmount", value)}
                  type="number"
                />
                <Field
                  label="Next due date"
                  value={form.due}
                  onChange={(value) => set("due", value)}
                  type="date"
                />
                <div className="flex min-h-12 items-center border-2 border-ink bg-good-soft px-4 text-sm font-black uppercase">
                  Essential · monthly · manual
                </div>
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <Eyebrow>How should we learn?</Eyebrow>
              <Title>Choose your starting pace.</Title>
              <Copy>Start with a safe baseline, or let SuperFinz learn from your real entries for 1–2 months before personalising the split.</Copy>
              <div className="mt-7 grid gap-4">
                <Choice selected={form.trackingMode === "START_NOW"} onClick={() => set("trackingMode", "START_NOW")}>Start now · use a safe baseline estimate</Choice>
                <Choice selected={form.trackingMode === "OBSERVE_LEARN"} onClick={() => set("trackingMode", "OBSERVE_LEARN")}>Observe & learn · track quietly for 1–2 months</Choice>
              </div>
              <ChoiceGroup label="Where does your essential money usually go?">
                {spendingCategories.map((category) => <Choice key={category} selected={form.essentialCategories.includes(category)} onClick={() => set("essentialCategories", form.essentialCategories.includes(category) ? form.essentialCategories.filter((item) => item !== category) : [...form.essentialCategories, category])}>{category}</Choice>)}
              </ChoiceGroup>
              <Field label="Which expense is hardest to protect? (optional)" value={form.hardestToProtect} onChange={(value) => set("hardestToProtect", value)} />
            </>
          )}
          {step === 5 && (
            <>
              <Eyebrow>Protection rule</Eyebrow>
              <Title>Give every payout a job.</Title>
              <Copy>
                Edit the percentages, then explicitly confirm. This prototype
                saves a planned allocation and does not move real money.
              </Copy>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Essentials (%)"
                  value={form.essentials}
                  onChange={(value) => set("essentials", value)}
                  type="number"
                />
                <Field
                  label="Work costs (%)"
                  value={form.work}
                  onChange={(value) => set("work", value)}
                  type="number"
                />
                <Field
                  label="Emergency cushion (%)"
                  value={form.emergency}
                  onChange={(value) => set("emergency", value)}
                  type="number"
                />
                <Field
                  label="Long-term savings (%)"
                  value={form.longTerm}
                  onChange={(value) => set("longTerm", value)}
                  type="number"
                />
                <Field
                  label="Flexible spending (%)"
                  value={form.flexible}
                  onChange={(value) => set("flexible", value)}
                  type="number"
                />
                <div className="flex min-h-12 items-center justify-between border-2 border-ink bg-paper-2 px-4">
                  <span className="brut-label">Total</span>
                  <strong
                    className={`num text-2xl ${splitTotal === 100 ? "text-good" : "text-bad"}`}
                  >
                    {splitTotal}%
                  </strong>
                </div>
              </div>
              <label className="mt-6 flex min-h-14 cursor-pointer items-center gap-3 border-2 border-ink bg-paper-2 p-4 font-black">
                <input
                  type="checkbox"
                  checked={form.confirmed}
                  onChange={(event) => set("confirmed", event.target.checked)}
                  className="h-6 w-6 accent-accent"
                />
                I confirm this planned Smart Split rule.
              </label>
              {!form.confirmed && (
                <p
                  role="alert"
                  className="mt-3 border-2 border-warn bg-warn-soft p-3 text-sm font-bold"
                >
                  Confirm the Smart Split rule to enable “Build my plan”.
                </p>
              )}
              <div className="mt-5 border-2 border-ink bg-accent-soft p-4">
                <p className="brut-label">Review</p>
                <p className="mt-2 font-semibold leading-7">
                  {form.workTypes.map((item) => labels[item]).join(", ")} in{" "}
                  {form.city}
                  <br />
                  Weekly estimate: ₹{Number(form.low).toLocaleString("en-IN")}–₹
                  {Number(form.good).toLocaleString("en-IN")}
                  <br />
                  Next essential: {form.commitment} · ₹
                  {Number(form.commitmentAmount).toLocaleString("en-IN")}
                </p>
              </div>
            </>
          )}
          {error && (
            <p
              role="alert"
              className="mt-6 border-2 border-bad bg-bad-soft p-3 font-bold text-bad"
            >
              {error}
            </p>
          )}
          <div className="mt-8 flex justify-between gap-3">
            {step > 0 ? (
              <button
                onClick={() => setStep((value) => value - 1)}
                disabled={saving}
                className="brut-btn min-h-12 bg-paper text-ink"
              >
                <ArrowLeft aria-hidden size={17} />
                Back
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={
                step === 5 ? submit : () => setStep((value) => value + 1)
              }
              disabled={!valid || saving}
              className="brut-btn min-h-12 bg-accent text-paper"
            >
              {saving ? "Saving…" : step === 5 ? "Build my plan" : "Continue"}
              {step === 5 ? (
                <Check aria-hidden size={17} />
              ) : (
                <ArrowRight aria-hidden size={17} />
              )}
            </button>
          </div>
        </section>
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm font-semibold text-ink-soft">
          <ShieldCheck aria-hidden size={16} />
          Draft saved on this device. No financial account is connected.
        </p>
      </div>
    </main>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="brut-label text-accent">{children}</p>;
}
function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="brut-display mt-2 text-4xl sm:text-5xl">{children}</h1>;
}
function Copy({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 max-w-2xl font-semibold leading-7 text-ink-soft">
      {children}
    </p>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="brut-label">{label}</span>
      <input
        aria-label={label}
        type={type}
        min={type === "number" ? 0 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 border-2 border-ink bg-paper px-3 text-base font-bold outline-none focus:ring-4 focus:ring-accent/30"
      />
    </label>
  );
}
function ChoiceGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="brut-label mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 border-2 border-ink px-3 text-xs font-black uppercase tracking-wide ${selected ? "bg-ink text-paper" : "bg-paper hover:bg-paper-2"}`}
    >
      {selected && <Check aria-hidden className="mr-1 inline" size={14} />}
      {children}
    </button>
  );
}
