"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarCheck,
  CirclePlus,
  Clock3,
  Gauge,
  Target,
  Trash2,
} from "lucide-react";
import { simulateGigScenario, type GigScenarioInput } from "@superfinz/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ErrorPanel, LoadingPanel, PageHeading } from "./page-state";
import { jsonRequest, useGigDashboard } from "./use-gig-dashboard";

const futureDate = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

export function PlanClient() {
  const { dashboard, loading, error, refresh } = useGigDashboard();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    dueDate: futureDate(7),
    recurrence: "MONTHLY",
  });
  const [scenario, setScenario] = useState<GigScenarioInput>({
    incomeChangePct: 0,
    payoutDelayDays: 0,
    surpriseCost: 0,
    workDaysOff: 0,
    workCostChangePct: 0,
  });

  const scenarioResult = useMemo(() => {
    if (!dashboard) return null;
    return simulateGigScenario(dashboard, scenario);
  }, [dashboard, scenario]);
  if (loading) return <LoadingPanel label="Building your 30-day plan" />;
  if (error || !dashboard || !scenarioResult)
    return <ErrorPanel message={error ?? "No plan found"} retry={refresh} />;

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    try {
      await jsonRequest("/api/gig/commitments", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.title.trim(),
          amount: Number(form.amount),
          dueDate: new Date(`${form.dueDate}T12:00:00`).toISOString(),
          recurrence: form.recurrence,
          essential: true,
          priority: 1,
          autopay: false,
        }),
      });
      setForm({
        title: "",
        amount: "",
        dueDate: futureDate(7),
        recurrence: "MONTHLY",
      });
      setShowForm(false);
      await refresh();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not add commitment",
      );
    } finally {
      setBusy(false);
    }
  };
  const markPaid = async (id: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await jsonRequest("/api/gig/commitments", {
        method: "PATCH",
        body: JSON.stringify({ id, status: "PAID" }),
      });
      await refresh();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not mark this paid",
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await jsonRequest("/api/gig/commitments", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      await refresh();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not remove commitment",
      );
    } finally {
      setBusy(false);
    }
  };

  const lowNet =
    dashboard.summary.forecastIncomeLow30d -
    dashboard.summary.committedOutflow30d -
    dashboard.summary.estimatedWorkCosts30d;
  const highNet =
    dashboard.summary.forecastIncomeHigh30d -
    dashboard.summary.committedOutflow30d -
    dashboard.summary.estimatedWorkCosts30d;
  const earningGap = Math.max(
    0,
    dashboard.summary.committedOutflow30d +
      dashboard.summary.estimatedWorkCosts30d +
      dashboard.profile.safetyBuffer -
      dashboard.summary.forecastIncomeLow30d,
  );
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Plan ahead"
        title="See if your bills stay safe."
        copy="Try a lower-income week, a late payout, or a surprise cost. Money you expect is kept separate from money already received."
        action={
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="brut-btn min-h-12 bg-accent text-paper"
          >
            <CirclePlus aria-hidden size={17} />
            Add commitment
          </button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Forecast
          label="Income range"
          value={`${formatCurrency(dashboard.summary.forecastIncomeLow30d)}–${formatCurrency(dashboard.summary.forecastIncomeHigh30d)}`}
          detail={`${dashboard.summary.forecastConfidence.toLowerCase()} confidence`}
        />
        <Forecast
          label="Commitments"
          value={formatCurrency(dashboard.summary.committedOutflow30d)}
          detail="Next 30 days"
        />
        <Forecast
          label="Work costs"
          value={formatCurrency(dashboard.summary.estimatedWorkCosts30d)}
          detail="Estimated from your pattern"
        />
        <Forecast
          label="End-of-month range"
          value={`${formatCurrency(lowNet)}–${formatCurrency(highNet)}`}
          detail="Before flexible spending"
          tone={lowNet < 0 ? "bad" : "good"}
        />
      </section>
      <ForecastChart dashboard={dashboard} />
      {showForm && (
        <section className="brut-card-lg p-5 sm:p-6">
          <p className="brut-label">New commitment</p>
          <h2 className="brut-display mt-1 text-3xl">Protect a due payment.</h2>
          <form onSubmit={create} className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              value={form.title}
              onChange={(value) =>
                setForm((current) => ({ ...current, title: value }))
              }
            />
            <Field
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(value) =>
                setForm((current) => ({ ...current, amount: value }))
              }
            />
            <Field
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(value) =>
                setForm((current) => ({ ...current, dueDate: value }))
              }
            />
            <label className="grid gap-2">
              <span className="brut-label">Repeats</span>
              <select
                value={form.recurrence}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recurrence: event.target.value,
                  }))
                }
                className="min-h-12 border-2 border-ink bg-paper px-3 text-base font-bold"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="FORTNIGHTLY">Fortnightly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="ONE_TIME">One time</option>
              </select>
            </label>
            {actionError && <ActionError message={actionError} />}
            <div className="flex gap-3 sm:col-span-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="brut-btn min-h-12 flex-1 bg-paper"
              >
                Cancel
              </button>
              <button
                disabled={
                  busy || !form.title.trim() || Number(form.amount) <= 0
                }
                className="brut-btn min-h-12 flex-1 bg-ink text-paper"
              >
                {busy ? "Saving…" : "Add commitment"}
              </button>
            </div>
          </form>
        </section>
      )}
      {!showForm && actionError && <ActionError message={actionError} />}
      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <section className="brut-card overflow-hidden">
          <div className="border-b-2 border-ink bg-paper-2 p-4">
            <p className="brut-label">Payment calendar</p>
            <h2 className="mt-1 text-xl font-black">Upcoming commitments</h2>
          </div>
          {dashboard.commitments.length === 0 ? (
            <div className="p-10 text-center font-semibold text-ink-soft">
              No commitments yet.
            </div>
          ) : (
            dashboard.commitments.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-center gap-3 border-b border-ink/30 p-4 last:border-b-0"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center border-2 border-ink ${item.status === "PAID" ? "bg-good-soft" : "bg-warn-soft"}`}
                >
                  <CalendarCheck aria-hidden size={18} />
                </div>
                <div className="min-w-40 flex-1">
                  <p className="font-black">{item.title}</p>
                  <p className="text-xs font-semibold text-ink-soft">
                    Due {formatDate(item.dueDate)} ·{" "}
                    {item.recurrence.toLowerCase().replace("_", " ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-lg font-black">
                    {formatCurrency(item.amount)}
                  </p>
                  <span
                    className={`text-[10px] font-black uppercase ${item.status === "PAID" ? "text-good" : "text-warn"}`}
                  >
                    {item.status}
                  </span>
                </div>
                {item.status !== "PAID" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void markPaid(item.id)}
                    className="min-h-11 border-2 border-ink bg-good-soft px-3 text-xs font-black uppercase"
                  >
                    Mark paid
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove(item.id)}
                  aria-label={`Delete ${item.title}`}
                  className="flex h-11 w-11 items-center justify-center border-2 border-transparent text-bad hover:border-ink hover:bg-bad-soft"
                >
                  <Trash2 aria-hidden size={17} />
                </button>
              </article>
            ))
          )}
        </section>
        <aside className="space-y-4">
          <section
            className={`brut-card p-5 ${earningGap > 0 ? "bg-warn-soft" : "bg-good-soft"}`}
          >
            <Target aria-hidden size={23} />
            <p className="brut-label mt-4">Minimum earning target</p>
            <p className="num mt-2 text-4xl font-black">
              {formatCurrency(earningGap)}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6">
              {earningGap > 0
                ? "Extra settled income needed in the low case to cover commitments, work costs, and your buffer."
                : "Your low-case forecast covers the current protected plan."}
            </p>
          </section>
          <section className="brut-card p-5">
            <Clock3 aria-hidden size={23} />
            <p className="brut-label mt-4">Next known events</p>
            <div className="mt-3 space-y-3">
              {dashboard.timeline.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  className="border-t-2 border-ink pt-3 first:border-0 first:pt-0"
                >
                  <div className="flex justify-between gap-3">
                    <strong className="text-sm">{event.title}</strong>
                    <span className="num whitespace-nowrap text-sm font-black">
                      {event.amountMin === event.amountMax
                        ? formatCurrency(event.amountMin)
                        : `${formatCurrency(event.amountMin)}–${formatCurrency(event.amountMax)}`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-ink-soft">
                    {formatDate(event.date)} · {event.status.toLowerCase()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
      <section className="brut-card-lg bg-ink p-5 text-paper sm:p-6">
        <div className="flex items-start gap-3">
          <Gauge aria-hidden className="text-accent" size={25} />
          <div>
            <p className="brut-label !text-paper-2">Scenario tester</p>
            <h2 className="brut-display mt-1 text-3xl">
              What if the month changes?
            </h2>
            <p className="mt-2 text-sm font-semibold text-paper-2">
              This is a private planning calculation. It does not change your
              saved data.
            </p>
          </div>
        </div>
        <div
          className="mt-5 flex flex-wrap gap-2"
          aria-label="Scenario presets"
        >
          <Preset
            label="Baseline"
            onClick={() =>
              setScenario({
                incomeChangePct: 0,
                payoutDelayDays: 0,
                surpriseCost: 0,
                workDaysOff: 0,
                workCostChangePct: 0,
              })
            }
          />
          <Preset
            label="Income −20%"
            onClick={() =>
              setScenario({
                incomeChangePct: -20,
                payoutDelayDays: 0,
                surpriseCost: 0,
                workDaysOff: 0,
                workCostChangePct: 0,
              })
            }
          />
          <Preset
            label="Payout +3 days"
            onClick={() =>
              setScenario({
                incomeChangePct: 0,
                payoutDelayDays: 3,
                surpriseCost: 0,
                workDaysOff: 0,
                workCostChangePct: 0,
              })
            }
          />
          <Preset
            label="₹2,500 repair"
            onClick={() =>
              setScenario({
                incomeChangePct: 0,
                payoutDelayDays: 0,
                surpriseCost: 2500,
                workDaysOff: 0,
                workCostChangePct: 0,
              })
            }
          />
          <Preset
            label="2 workdays off"
            onClick={() =>
              setScenario({
                incomeChangePct: 0,
                payoutDelayDays: 0,
                surpriseCost: 0,
                workDaysOff: 2,
                workCostChangePct: 0,
              })
            }
          />
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-5">
          <Range
            label="Income change"
            min={-50}
            max={30}
            step={5}
            value={scenario.incomeChangePct}
            suffix="%"
            onChange={(value) =>
              setScenario((current) => ({ ...current, incomeChangePct: value }))
            }
          />
          <Range
            label="Payout delay"
            min={0}
            max={14}
            step={1}
            value={scenario.payoutDelayDays}
            suffix=" days"
            onChange={(value) =>
              setScenario((current) => ({ ...current, payoutDelayDays: value }))
            }
          />
          <Range
            label="Surprise cost"
            min={0}
            max={10000}
            step={250}
            value={scenario.surpriseCost}
            prefix="₹"
            onChange={(value) =>
              setScenario((current) => ({ ...current, surpriseCost: value }))
            }
          />
          <Range
            label="Workdays off"
            min={0}
            max={10}
            step={1}
            value={scenario.workDaysOff}
            suffix=" days"
            onChange={(value) =>
              setScenario((current) => ({ ...current, workDaysOff: value }))
            }
          />
          <Range
            label="Work-cost change"
            min={-30}
            max={50}
            step={5}
            value={scenario.workCostChangePct}
            suffix="%"
            onChange={(value) =>
              setScenario((current) => ({
                ...current,
                workCostChangePct: value,
              }))
            }
          />
        </div>
        <div
          className="mt-6 grid gap-4 border-2 border-paper-2 p-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-live="polite"
        >
          <ForecastDark
            label="Safe to spend"
            value={formatCurrency(scenarioResult.safeToSpend)}
          />
          <ForecastDark
            label="30-day income"
            value={`${formatCurrency(scenarioResult.forecastIncomeLow30d)}–${formatCurrency(scenarioResult.forecastIncomeHigh30d)}`}
          />
          <ForecastDark
            label="Lowest balance"
            value={formatCurrency(scenarioResult.lowestProjectedBalance)}
          />
          <ForecastDark
            label="Protected days"
            value={`${scenarioResult.protectedDays.toFixed(1)} days`}
          />
          <ForecastDark
            label="Verified gap"
            value={formatCurrency(scenarioResult.earningTarget)}
          />
          <ForecastDark
            label="Target / workday"
            value={formatCurrency(scenarioResult.targetPerRemainingWorkday)}
          />
          <div className="sm:col-span-2">
            <p className="brut-label !text-paper-2">Recommended action</p>
            <p className="mt-1 font-black text-accent">
              {scenarioResult.recommendedAction}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="border-2 border-paper-2 p-4">
            <p className="brut-label !text-paper-2">Payments at risk</p>
            {scenarioResult.atRiskCommitments.length ? (
              <ul className="mt-3 space-y-2">
                {scenarioResult.atRiskCommitments.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-3 text-sm font-bold"
                  >
                    <span>
                      {item.title} · {formatDate(item.dueDate)}
                    </span>
                    <span className="num text-accent">
                      {formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm font-semibold text-paper-2">
                No recorded commitment becomes uncovered in this scenario.
              </p>
            )}
          </div>
          <div className="border-2 border-paper-2 p-4">
            <p className="brut-label !text-paper-2">Try before credit</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-semibold text-paper-2">
              {scenarioResult.nonCreditAlternatives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function ForecastChart({
  dashboard,
}: {
  dashboard: import("@superfinz/shared").GigDashboardDto;
}) {
  const values = dashboard.forecast
    .flatMap((point) => [
      point.actual,
      point.conservative,
      point.typical,
      point.optimistic,
      point.safetyFloor,
    ])
    .filter((value): value is number => value !== null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const x = (index: number) =>
    (index / Math.max(1, dashboard.forecast.length - 1)) * 100;
  const y = (value: number) => 94 - ((value - min) / span) * 84;
  const line = (key: "actual" | "conservative" | "typical" | "optimistic") =>
    dashboard.forecast
      .map((point, index) =>
        point[key] === null ? null : `${x(index)},${y(point[key]!)}`,
      )
      .filter(Boolean)
      .join(" ");
  const future = dashboard.forecast
    .map((point, index) =>
      point.conservative === null || point.optimistic === null
        ? null
        : {
            x: x(index),
            low: y(point.conservative),
            high: y(point.optimistic),
          },
    )
    .filter(
      (point): point is { x: number; low: number; high: number } =>
        point !== null,
    );
  const rangePolygon = [
    ...future.map((point) => `${point.x},${point.high}`),
    ...future
      .slice()
      .reverse()
      .map((point) => `${point.x},${point.low}`),
  ].join(" ");
  return (
    <section className="brut-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="brut-label">Balance forecast</p>
          <h2 className="mt-1 text-xl font-black">
            7 actual days + 30 projected days
          </h2>
        </div>
        <span
          className={`brut-stamp ${dashboard.summary.lowestProjectedBalanceLow < dashboard.profile.safetyBuffer ? "bg-warn-soft" : "bg-good-soft"}`}
        >
          {dashboard.summary.forecastConfidence.toLowerCase()} confidence
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs font-black">
        <Legend color="bg-ink" label="Actual" />
        <Legend color="bg-accent" label="Typical" />
        <Legend color="bg-good" label="Forecast range" />
        <Legend color="bg-bad" label="Safety floor" />
      </div>
      <div className="mt-4 min-w-0 overflow-x-auto">
        <svg
          viewBox="0 0 100 100"
          className="h-64 min-w-[44rem] w-full border-2 border-ink bg-paper-2"
          role="img"
          aria-label={`Balance forecast. Conservative lowest balance ${formatCurrency(dashboard.summary.lowestProjectedBalanceLow)}, optimistic lowest balance ${formatCurrency(dashboard.summary.lowestProjectedBalanceHigh)}, safety floor ${formatCurrency(dashboard.profile.safetyBuffer)}.`}
        >
          <line
            x1="0"
            x2="100"
            y1={y(dashboard.profile.safetyBuffer)}
            y2={y(dashboard.profile.safetyBuffer)}
            stroke="var(--bad)"
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <polygon
            points={rangePolygon}
            fill="var(--good-soft)"
            stroke="none"
          />
          <polyline
            points={line("conservative")}
            fill="none"
            stroke="var(--good)"
            strokeWidth=".8"
            strokeDasharray="2 1"
          />
          <polyline
            points={line("optimistic")}
            fill="none"
            stroke="var(--good)"
            strokeWidth=".8"
            strokeDasharray="2 1"
          />
          <polyline
            points={line("typical")}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.4"
          />
          <polyline
            points={line("actual")}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.8"
          />
        </svg>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Forecast
          label="Lowest conservative balance"
          value={formatCurrency(dashboard.summary.lowestProjectedBalanceLow)}
          detail="Low-income case"
          tone={
            dashboard.summary.lowestProjectedBalanceLow <
            dashboard.profile.safetyBuffer
              ? "bad"
              : "good"
          }
        />
        <Forecast
          label="Lowest optimistic balance"
          value={formatCurrency(dashboard.summary.lowestProjectedBalanceHigh)}
          detail="Good-income case"
        />
        <Forecast
          label="Safety floor"
          value={formatCurrency(dashboard.profile.safetyBuffer)}
          detail="Your minimum buffer"
        />
      </div>
      <p className="mt-3 text-xs font-semibold text-ink-soft">
        The shaded area is uncertainty, not money already received. Update
        source ranges when work patterns change.
      </p>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <i className={`h-3 w-5 border border-ink ${color}`} />
      {label}
    </span>
  );
}

function Forecast({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "bad" | "good";
}) {
  return (
    <div
      className={`brut-card p-5 ${tone === "bad" ? "bg-bad-soft" : tone === "good" ? "bg-good-soft" : ""}`}
    >
      <p className="brut-label">{label}</p>
      <p className="num mt-2 text-2xl font-black">{value}</p>
      <p className="mt-2 text-xs font-semibold text-ink-soft">{detail}</p>
    </div>
  );
}
function ForecastDark({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="brut-label !text-paper-2">{label}</p>
      <p className="num mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
function Preset({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 border-2 border-paper-2 px-3 text-xs font-black uppercase tracking-wide hover:bg-paper hover:text-ink"
    >
      {label}
    </button>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="brut-label">{label}</span>
      <input
        type={type}
        min={type === "number" ? 0 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 border-2 border-ink bg-paper px-3 text-base font-bold outline-none focus:ring-4 focus:ring-accent/30"
        required
      />
    </label>
  );
}
function ActionError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="border-2 border-bad bg-bad-soft p-3 text-sm font-bold text-bad sm:col-span-2"
    >
      {message}
    </p>
  );
}
function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  prefix = "",
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="flex justify-between text-xs font-black uppercase tracking-wide">
        <span>{label}</span>
        <strong className="num text-accent">
          {prefix}
          {value.toLocaleString("en-IN")}
          {suffix}
        </strong>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full accent-accent"
      />
    </label>
  );
}
