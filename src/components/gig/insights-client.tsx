"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Gauge,
  Share2,
  ShieldCheck,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import {
  deriveGigInsights,
  simulateGigScenario,
  type GigDashboardDto,
  type GigScenarioInput,
} from "@superfinz/shared";
import { formatCurrency } from "@/lib/utils";

const scenarios: Array<{
  id: string;
  label: string;
  detail: string;
  input: GigScenarioInput;
}> = [
  {
    id: "late",
    label: "Payout 3 days late",
    detail: "Check bills and work money during a delay.",
    input: {
      incomeChangePct: 0,
      payoutDelayDays: 3,
      surpriseCost: 0,
      workDaysOff: 0,
      workCostChangePct: 0,
    },
  },
  {
    id: "slow",
    label: "Income falls 30%",
    detail: "See how a weaker month changes the plan.",
    input: {
      incomeChangePct: -30,
      payoutDelayDays: 0,
      surpriseCost: 0,
      workDaysOff: 0,
      workCostChangePct: 0,
    },
  },
  {
    id: "repair",
    label: "₹2,500 repair",
    detail: "Test an urgent earning-related cost.",
    input: {
      incomeChangePct: 0,
      payoutDelayDays: 0,
      surpriseCost: 2_500,
      workDaysOff: 0,
      workCostChangePct: 0,
    },
  },
  {
    id: "rest",
    label: "Take one day off",
    detail: "Check the impact before choosing a rest day.",
    input: {
      incomeChangePct: 0,
      payoutDelayDays: 0,
      surpriseCost: 0,
      workDaysOff: 1,
      workCostChangePct: 0,
    },
  },
];

export function InsightsClient({
  dashboard,
  backHref,
  demo = false,
}: {
  dashboard: GigDashboardDto;
  backHref: string;
  demo?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(scenarios[0].id);
  const [shareStatus, setShareStatus] = useState("");
  const insights = useMemo(() => deriveGigInsights(dashboard), [dashboard]);
  const selected = scenarios.find((item) => item.id === selectedId)!;
  const scenario = useMemo(
    () => simulateGigScenario(dashboard, selected.input),
    [dashboard, selected],
  );
  const workCostWidth = Math.min(100, insights.earnings.workCostPerHundred);
  const keepWidth = Math.max(
    0,
    Math.min(100, insights.earnings.keptPerHundred),
  );
  const statusLabel =
    insights.outlook.status === "ON_TRACK"
      ? "Plan holds"
      : insights.outlook.status === "WATCH"
        ? "Watch closely"
        : "Action needed";
  const statusClass =
    insights.outlook.status === "ON_TRACK"
      ? "bg-good-soft text-good"
      : insights.outlook.status === "WATCH"
        ? "bg-warn-soft text-warn"
        : "bg-bad-soft text-bad";

  const shareSummary = [
    "My SuperFinz plan",
    `Safe to spend now: ${formatCurrency(dashboard.summary.safeToSpend)}`,
    `30-day projected low point: ${formatCurrency(insights.outlook.lowestBalanceLow)} to ${formatCurrency(insights.outlook.lowestBalanceHigh)}`,
    `Weekly take-home after work costs: ${formatCurrency(insights.earnings.net)}`,
    `Emergency cover: ${Math.floor(dashboard.summary.protectedDays)} days`,
    "Forecasts are estimates. SuperFinz plans money but does not move it.",
  ].join("\n");

  async function sharePlan() {
    setShareStatus("");
    try {
      if (navigator.share) {
        await navigator.share({ title: "My SuperFinz plan", text: shareSummary });
        setShareStatus("Summary shared.");
        return;
      }
      await navigator.clipboard.writeText(shareSummary);
      setShareStatus("Summary copied. You choose where to send it.");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setShareStatus("Could not open sharing. Please try again.");
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-paper-2"
        >
          <ArrowLeft aria-hidden size={17} />
          Back
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-accent">
          SuperFinz Plus preview
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
          Plan further than today.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink-soft">
          Deeper tools stay on this page, so your everyday dashboard remains
          simple. Every figure comes from the same saved money plan.
        </p>
      </header>

      {demo && (
        <div className="rounded-2xl border border-warn bg-warn-soft p-4 text-sm font-semibold text-ink">
          Previewing Ravi&apos;s fictional data. Nothing here connects to a bank,
          moves money, or applies for credit.
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="overflow-hidden rounded-3xl bg-ink p-5 text-paper shadow-[var(--shadow-md)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-paper-2">
                30-day runway
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {insights.outlook.title}
              </h2>
            </div>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-paper-2">
            {insights.outlook.body}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric
              dark
              label="Low estimate"
              value={formatCurrency(insights.outlook.lowestBalanceLow)}
            />
            <Metric
              dark
              label="High estimate"
              value={formatCurrency(insights.outlook.lowestBalanceHigh)}
            />
            <Metric
              dark
              label="Your safety floor"
              value={formatCurrency(insights.outlook.safetyFloor)}
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-paper-2">
            {insights.month.confidence.toLowerCase()} confidence · expected
            income remains an estimate and is never added to today&apos;s safe
            amount.
          </p>
        </article>

        <article className="brut-card p-5 sm:p-6">
          <div className="flex items-center gap-3 text-accent">
            <WalletCards aria-hidden size={22} />
            <p className="text-sm font-semibold">True earnings lens</p>
          </div>
          <p className="mt-5 text-sm text-ink-soft">
            For every ₹100 earned
          </p>
          <p className="num mt-1 text-4xl font-bold tracking-[-0.05em]">
            ₹{Math.max(0, Math.round(insights.earnings.keptPerHundred))}
            <span className="ml-2 text-base font-semibold text-ink-soft">
              stays after work costs
            </span>
          </p>
          <div
            className="mt-5 flex h-3 overflow-hidden rounded-full bg-paper-2"
            aria-label={`${Math.round(keepWidth)} percent kept and ${Math.round(workCostWidth)} percent used for work costs`}
          >
            <span className="h-full bg-accent" style={{ width: `${keepWidth}%` }} />
            <span
              className="h-full bg-warn"
              style={{ width: `${workCostWidth}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="Take-home" value={formatCurrency(insights.earnings.net)} />
            <Metric
              label="Work costs"
              value={formatCurrency(insights.earnings.workCosts)}
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-mute">
            {insights.earnings.basis === "ACTUAL_WEEK"
              ? "Based on settled entries from the last seven days."
              : "Not enough settled income this week, so this uses your typical week."}
          </p>
        </article>
      </section>

      <section className="brut-card p-5 sm:p-7" aria-labelledby="shield-title">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <ShieldCheck aria-hidden size={23} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">
              Slow-week Shield
            </p>
            <h2 id="shield-title" className="mt-1 text-2xl font-bold">
              Test a change before it happens.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              Choose one common gig-work situation. SuperFinz recalculates the
              safe amount, monthly low point, and smallest non-credit response.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {scenarios.map((item) => {
            const active = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(item.id)}
                className={`min-h-28 cursor-pointer rounded-2xl border p-4 text-left transition-colors focus-visible:outline-offset-2 ${
                  active
                    ? "border-accent bg-accent-soft text-ink"
                    : "border-ink bg-surface text-ink hover:bg-paper-2"
                }`}
              >
                <span className="flex items-center justify-between gap-2 font-semibold">
                  {item.label}
                  {active && <Check aria-hidden size={18} className="text-accent" />}
                </span>
                <span className="mt-2 block text-xs leading-5 text-ink-soft">
                  {item.detail}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className={`mt-5 rounded-2xl border p-5 ${scenario.earningTarget > 0 ? "border-warn bg-warn-soft" : "border-good bg-good-soft"}`}
          aria-live="polite"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
                Result for {selected.label}
              </p>
              <p className="mt-2 text-sm text-ink-soft">Safe to spend</p>
              <p className="num text-4xl font-bold tracking-[-0.05em]">
                {formatCurrency(scenario.safeToSpend)}
              </p>
            </div>
            <div className="min-w-48">
              <p className="text-sm text-ink-soft">Verified gap</p>
              <p className="num mt-1 text-2xl font-bold">
                {formatCurrency(scenario.earningTarget)}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {scenario.earningTarget > 0
                  ? `${formatCurrency(scenario.targetPerRemainingWorkday)} per remaining workday`
                  : "No extra earning target needed"}
              </p>
            </div>
          </div>
          <div className="mt-5 border-t border-ink pt-4">
            <p className="flex items-start gap-2 text-sm font-semibold">
              {scenario.earningTarget > 0 ? (
                <TriangleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
              ) : (
                <Check aria-hidden size={18} className="mt-0.5 shrink-0" />
              )}
              {scenario.recommendedAction}
            </p>
            {scenario.atRiskCommitments.length > 0 && (
              <p className="mt-2 text-xs leading-5 text-ink-soft">
                Check first: {scenario.atRiskCommitments.slice(0, 2).map((item) => item.title).join(", ")}.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="brut-card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-paper-2 text-accent">
            <Share2 aria-hidden size={21} />
          </span>
          <div>
            <h2 className="text-xl font-bold">Share only when you choose</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-ink-soft">
              Create a short plan summary for your family or financial
              counsellor. SuperFinz never reads your contacts.
            </p>
            <p className="mt-1 text-xs text-mute" aria-live="polite">
              {shareStatus}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={sharePlan}
          className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-5 font-semibold text-paper transition-opacity hover:opacity-90"
        >
          <Share2 aria-hidden size={18} />
          Share my summary
        </button>
      </section>

      <p className="flex items-start gap-2 text-xs leading-5 text-mute">
        <Gauge aria-hidden size={16} className="mt-0.5 shrink-0" />
        Forecasts are planning estimates, not guarantees. SuperFinz does not
        move money, approve credit, or replace professional financial advice.
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        dark ? "border-paper-2 bg-white/5" : "border-ink bg-surface"
      }`}
    >
      <p className={`text-xs font-semibold ${dark ? "text-paper-2" : "text-mute"}`}>
        {label}
      </p>
      <p className="num mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
