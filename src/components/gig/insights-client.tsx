"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Gauge,
  Info,
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
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

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
  const [sharing, setSharing] = useState(false);
  const insights = useMemo(() => deriveGigInsights(dashboard), [dashboard]);
  const selected = scenarios.find((item) => item.id === selectedId) ?? scenarios[0];
  const scenario = useMemo(
    () => simulateGigScenario(dashboard, selected.input),
    [dashboard, selected],
  );

  const keptPerHundred = Math.max(
    0,
    Math.min(100, Math.round(insights.earnings.keptPerHundred)),
  );
  const workCostPerHundred = Math.max(
    0,
    Math.min(100, Math.round(insights.earnings.workCostPerHundred)),
  );

  const statusLabel =
    insights.outlook.status === "ON_TRACK"
      ? "Plan holds"
      : insights.outlook.status === "WATCH"
        ? "Watch closely"
        : "Action needed";
  const statusVariant =
    insights.outlook.status === "ON_TRACK"
      ? "good"
      : insights.outlook.status === "WATCH"
        ? "warn"
        : "bad";

  // The plan holds only when nothing needs covering and there is still room to spend.
  const planHolds = scenario.earningTarget <= 0 && scenario.safeToSpend > 0;

  const shareSummary = [
    "My SuperFinz plan",
    `Safe to spend now: ${formatCurrency(dashboard.summary.safeToSpend)}`,
    `30-day projected low point: ${formatCurrency(insights.outlook.lowestBalanceLow)} to ${formatCurrency(insights.outlook.lowestBalanceHigh)}`,
    `Weekly take-home after work costs: ${formatCurrency(insights.earnings.net)}`,
    `Emergency cover: ${Math.floor(dashboard.summary.protectedDays)} days`,
    "Forecasts are estimates. SuperFinz plans money but does not move it.",
  ].join("\n");

  async function sharePlan() {
    if (sharing) return;
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({ title: "My SuperFinz plan", text: shareSummary });
        toast.success("Summary shared");
        return;
      }
      await navigator.clipboard.writeText(shareSummary);
      toast.success("Summary copied. You choose where to send it.");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      toast.error("Could not open sharing. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <header>
        <Button asChild variant="secondary">
          <Link href={backHref}>
            <ArrowLeft aria-hidden size={17} />
            Back
          </Link>
        </Button>
        <p className="mt-6 brut-label text-accent-ink">
          SuperFinz Plus preview
        </p>
        <h1 className="brut-display mt-2 max-w-3xl text-3xl sm:text-5xl">
          Plan further than today.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink-soft">
          Deeper tools stay on this page, so your everyday dashboard remains
          simple. Every figure comes from the same saved money plan.
        </p>
      </header>

      {demo && (
        <div className="flex items-start gap-3 rounded-xl border border-line bg-warn-soft px-4 py-3 text-sm font-medium text-warn">
          <Info aria-hidden size={18} className="mt-0.5 shrink-0" />
          <p>
            Previewing Ravi&apos;s fictional data. Nothing here connects to a
            bank, moves money, or applies for credit.
          </p>
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <article
          className="overflow-hidden rounded-[1.5rem] bg-primary p-5 text-on-primary shadow-lg sm:p-7"
          aria-labelledby="runway-title"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-on-primary-soft">
                30-day runway
              </p>
              <h2 id="runway-title" className="mt-1 text-2xl font-bold tracking-[-0.02em]">
                {insights.outlook.title}
              </h2>
            </div>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-on-primary-soft">
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
          <p className="mt-4 text-xs leading-5 text-on-primary-soft">
            {insights.month.confidence.toLowerCase()} confidence · expected
            income remains an estimate and is never added to today&apos;s safe
            amount.
          </p>
        </article>

        <article className="brut-card p-5 sm:p-6" aria-labelledby="earnings-title">
          <div className="flex items-center gap-3 text-accent-ink">
            <WalletCards aria-hidden size={22} />
            <h2 id="earnings-title" className="text-sm font-semibold">
              True earnings lens
            </h2>
          </div>
          <p className="mt-5 text-sm text-ink-soft">For every ₹100 earned</p>
          <p className="num mt-1 text-4xl font-bold tracking-[-0.05em]">
            {formatCurrency(keptPerHundred)}
            <span className="ml-2 text-base font-semibold tracking-normal text-ink-soft">
              stays after work costs
            </span>
          </p>
          <div
            role="img"
            aria-label={`Of every ₹100 earned, ${formatCurrency(keptPerHundred)} is kept and ${formatCurrency(workCostPerHundred)} goes to work costs`}
            className="mt-5 flex h-3 overflow-hidden rounded-full bg-paper-2"
          >
            <span
              className="h-full bg-accent"
              style={{ width: `${keptPerHundred}%` }}
            />
            <span
              className="h-full bg-warn"
              style={{ width: `${workCostPerHundred}%` }}
            />
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-ink-soft">
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-accent" />
              Kept · {formatCurrency(keptPerHundred)}
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-warn" />
              Work costs · {formatCurrency(workCostPerHundred)}
            </li>
          </ul>
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
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
            <ShieldCheck aria-hidden size={23} />
          </span>
          <div>
            <p className="brut-label text-accent-ink">
              Slow-week Shield
            </p>
            <h2 id="shield-title" className="mt-1 text-2xl font-bold tracking-[-0.02em]">
              Test a change before it happens.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              Choose one common gig-work situation. SuperFinz recalculates the
              safe amount, monthly low point, and smallest non-credit response.
            </p>
          </div>
        </div>

        <div
          className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          role="group"
          aria-label="Choose a situation to test"
        >
          {scenarios.map((item) => {
            const active = item.id === selectedId;
            return (
              <Button
                key={item.id}
                variant="outline"
                aria-pressed={active}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "h-auto min-h-28 flex-col items-stretch justify-start whitespace-normal rounded-2xl p-4 text-left",
                  active && "border-accent bg-accent-soft",
                )}
              >
                <span className="flex items-center justify-between gap-2 font-semibold">
                  {item.label}
                  {active && (
                    <Check aria-hidden size={18} className="shrink-0 text-accent-ink" />
                  )}
                </span>
                <span className="mt-2 block text-xs font-normal leading-5 text-ink-soft">
                  {item.detail}
                </span>
              </Button>
            );
          })}
        </div>

        <p role="status" className="sr-only">
          Result for {selected.label}: {planHolds ? "plan holds" : "action needed"}
        </p>

        <div
          className={cn(
            "mt-5 rounded-2xl p-5",
            planHolds ? "bg-good-soft text-good" : "bg-warn-soft text-warn",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="brut-label text-current">
                {planHolds ? "Result · gap covered" : "Result · action needed"}
              </p>
              <p className="mt-1 text-sm font-medium text-ink-soft">
                {selected.label}
              </p>
              <p className="mt-3 text-sm text-ink-soft">Safe to spend</p>
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
          <div className="mt-5 border-t border-line pt-4">
            <p className="flex items-start gap-2 text-sm font-semibold">
              {planHolds ? (
                <Check aria-hidden size={18} className="mt-0.5 shrink-0" />
              ) : (
                <TriangleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
              )}
              <span className="text-ink">{scenario.recommendedAction}</span>
            </p>
            {scenario.atRiskCommitments.length > 0 && (
              <p className="mt-2 text-xs leading-5 text-ink-soft">
                Check first:{" "}
                {scenario.atRiskCommitments
                  .slice(0, 2)
                  .map((item) => item.title)
                  .join(", ")}
                .
              </p>
            )}
          </div>
        </div>
      </section>

      <section
        className="brut-card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        aria-labelledby="share-title"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-paper-2 text-accent-ink">
            <Share2 aria-hidden size={21} />
          </span>
          <div>
            <h2 id="share-title" className="text-xl font-bold tracking-[-0.02em]">
              Share only when you choose
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-ink-soft">
              Create a short plan summary for your family or financial
              counsellor. SuperFinz never reads your contacts.
            </p>
          </div>
        </div>
        <Button
          variant="accent"
          size="lg"
          onClick={sharePlan}
          loading={sharing}
          loadingLabel="Preparing your summary"
          className="shrink-0"
        >
          <Share2 aria-hidden size={18} />
          Share my summary
        </Button>
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
      className={cn(
        "rounded-2xl border p-4",
        dark
          ? "border-on-primary/15 bg-on-primary/10"
          : "border-line bg-surface",
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold",
          dark ? "text-on-primary-soft" : "text-mute",
        )}
      >
        {label}
      </p>
      <p className="num mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
