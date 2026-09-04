"use client";

import {
  memo,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  CirclePlus,
  Clock3,
  Gauge,
  RefreshCw,
  Target,
  Trash2,
} from "lucide-react";
import {
  simulateGigScenario,
  type CommitmentDto,
  type CommitmentRecurrence,
  type GigDashboardDto,
  type GigScenarioInput,
} from "@superfinz/shared";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ErrorPanel,
  LoadingPanel,
  PageHeading,
  RefreshingBar,
} from "./page-state";
import {
  jsonRequest,
  localDateString,
  useGigDashboard,
} from "./use-gig-dashboard";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

const futureDate = (days: number) =>
  localDateString(new Date(Date.now() + days * 86_400_000));

const BASELINE: GigScenarioInput = {
  incomeChangePct: 0,
  payoutDelayDays: 0,
  surpriseCost: 0,
  workDaysOff: 0,
  workCostChangePct: 0,
};

const PRESETS: Array<{ label: string; value: GigScenarioInput }> = [
  { label: "Baseline", value: BASELINE },
  { label: "Income −20%", value: { ...BASELINE, incomeChangePct: -20 } },
  { label: "Payout +3 days", value: { ...BASELINE, payoutDelayDays: 3 } },
  {
    label: `${formatCurrency(2500)} repair`,
    value: { ...BASELINE, surpriseCost: 2500 },
  },
  { label: "2 workdays off", value: { ...BASELINE, workDaysOff: 2 } },
];

const SCENARIO_KEYS = Object.keys(BASELINE) as Array<keyof GigScenarioInput>;

const sameScenario = (a: GigScenarioInput, b: GigScenarioInput) =>
  SCENARIO_KEYS.every((key) => a[key] === b[key]);

const COMMITMENT_STATUS: Record<
  CommitmentDto["status"],
  { label: string; variant: BadgeVariant }
> = {
  DUE: { label: "Due", variant: "warn" },
  PAID: { label: "Paid", variant: "good" },
  RESCHEDULED: { label: "Rescheduled", variant: "default" },
};

const RECURRENCE_LABEL: Record<CommitmentRecurrence, string> = {
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Fortnightly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
  ONE_TIME: "One time",
};

const humanize = (value: string) => {
  const text = value.toLowerCase().replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const emptyForm = () => ({
  title: "",
  amount: "",
  dueDate: futureDate(7),
  recurrence: "MONTHLY",
});

export function PlanClient() {
  const { dashboard, loading, refreshing, error, refresh } = useGigDashboard();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyCommitmentId, setBusyCommitmentId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [scenario, setScenario] = useState<GigScenarioInput>(BASELINE);
  const [announcedAction, setAnnouncedAction] = useState("");
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const formPanelId = useId();

  const scenarioResult = useMemo(() => {
    if (!dashboard) return null;
    return simulateGigScenario(dashboard, scenario);
  }, [dashboard, scenario]);

  // Announce only the recommendation, and only once the sliders settle.
  const recommendedAction = scenarioResult?.recommendedAction ?? "";
  useEffect(() => {
    const timer = window.setTimeout(
      () => setAnnouncedAction(recommendedAction),
      400,
    );
    return () => window.clearTimeout(timer);
  }, [recommendedAction]);

  // Move focus into the add panel when it opens.
  useEffect(() => {
    if (showForm) formHeadingRef.current?.focus();
  }, [showForm]);

  if (loading) return <LoadingPanel label="Building your 30-day plan" />;
  if (!dashboard || !scenarioResult)
    return <ErrorPanel message={error ?? "No plan found"} retry={refresh} />;

  const openForm = () => {
    setActionError(null);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    addButtonRef.current?.focus();
  };
  const onFormKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeForm();
    }
  };

  const create = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim()) {
      setActionError("Give this commitment a name so you can spot it later.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("Enter an amount above zero.");
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await jsonRequest("/api/gig/commitments", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.title.trim(),
          amount,
          dueDate: new Date(`${form.dueDate}T12:00:00`).toISOString(),
          recurrence: form.recurrence,
          essential: true,
          priority: 1,
          autopay: false,
        }),
      });
      setForm(emptyForm());
      setShowForm(false);
      addButtonRef.current?.focus();
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
    setBusyCommitmentId(id);
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
      setBusyCommitmentId(null);
    }
  };
  const remove = async (item: CommitmentDto) => {
    if (
      !window.confirm(
        `Delete ${item.title} (${formatCurrency(item.amount)})? It will leave your plan and forecast.`,
      )
    )
      return;
    setBusy(true);
    setBusyCommitmentId(null);
    setActionError(null);
    try {
      await jsonRequest("/api/gig/commitments", {
        method: "DELETE",
        body: JSON.stringify({ id: item.id }),
      });
      await refresh();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not remove commitment",
      );
    } finally {
      setBusy(false);
      setBusyCommitmentId(null);
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
    <div className="space-y-5 sm:space-y-6">
      <PageHeading
        eyebrow="Plan ahead"
        title="See if your bills stay safe."
        copy="Try a lower-income week, a late payout, or a surprise cost. Money you expect is kept separate from money already received."
        action={
          <Button
            ref={addButtonRef}
            variant="accent"
            size="lg"
            aria-expanded={showForm}
            aria-controls={showForm ? formPanelId : undefined}
            onClick={() => (showForm ? closeForm() : openForm())}
          >
            <CirclePlus aria-hidden size={18} />
            Add commitment
          </Button>
        }
      />
      <RefreshingBar active={refreshing} />
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-sm font-medium text-bad"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle aria-hidden size={16} />
            {error}
          </span>
          <Button variant="secondary" size="sm" onClick={refresh}>
            <RefreshCw aria-hidden size={15} />
            Try again
          </Button>
        </div>
      )}

      <section
        aria-label="30-day outlook"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Forecast
          label="Income range"
          value={`${formatCurrency(dashboard.summary.forecastIncomeLow30d)}–${formatCurrency(dashboard.summary.forecastIncomeHigh30d)}`}
          detail={`${humanize(dashboard.summary.forecastConfidence)} confidence`}
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
        <Card
          id={formPanelId}
          className="brut-card-lg"
          onKeyDown={onFormKeyDown}
        >
          <div className="min-w-0">
            <p className="brut-label">New commitment</p>
            <h2
              ref={formHeadingRef}
              tabIndex={-1}
              className="mt-1 text-xl font-bold tracking-[-0.02em] focus:outline-none"
            >
              Protect a due payment.
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-soft">
              Rent, EMIs, fees, or any bill with a date. The plan keeps money
              aside for it before it is due. Press Escape to close.
            </p>
          </div>
          <form
            onSubmit={create}
            noValidate
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <Input
              label="Name"
              required
              autoComplete="off"
              placeholder="Room rent"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
            <Input
              label="Amount"
              type="number"
              required
              min={0}
              step={1}
              prefix="₹"
              placeholder="0"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
            />
            <Input
              label="Due date"
              type="date"
              required
              value={form.dueDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
            />
            <Select
              label="Repeats"
              value={form.recurrence}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  recurrence: event.target.value,
                }))
              }
            >
              <option value="WEEKLY">Weekly</option>
              <option value="FORTNIGHTLY">Fortnightly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="ONE_TIME">One time</option>
            </Select>
            {actionError && <ActionError message={actionError} />}
            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={closeForm}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                loading={busy}
                loadingLabel="Saving"
              >
                Add commitment
              </Button>
            </div>
          </form>
        </Card>
      )}
      {!showForm && actionError && <ActionError message={actionError} />}

      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader
            eyebrow="Payment calendar"
            title="Upcoming commitments"
            action={
              dashboard.commitments.length > 0 ? (
                <Badge>
                  {dashboard.commitments.length}{" "}
                  {dashboard.commitments.length === 1 ? "item" : "items"}
                </Badge>
              ) : undefined
            }
          />
          {dashboard.commitments.length === 0 ? (
            <EmptyState
              className="mt-5"
              icon={CalendarCheck}
              title="No commitments yet"
              description="Add rent, EMIs, or recurring bills so the plan can protect them before they are due."
              action={
                <Button variant="accent" onClick={openForm}>
                  <CirclePlus aria-hidden size={17} />
                  Add your first commitment
                </Button>
              }
            />
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {dashboard.commitments.map((item) => {
                const status = COMMITMENT_STATUS[item.status];
                const rowBusy = busy && busyCommitmentId === item.id;
                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        item.status === "PAID"
                          ? "bg-good-soft text-good"
                          : "bg-warn-soft text-warn",
                      )}
                    >
                      <CalendarCheck size={18} />
                    </span>
                    <div className="min-w-40 flex-1">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="mt-0.5 text-sm text-ink-soft">
                        Due {formatDate(item.dueDate)} ·{" "}
                        {RECURRENCE_LABEL[item.recurrence] ??
                          humanize(item.recurrence)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <p className="num text-lg font-bold text-ink">
                        {formatCurrency(item.amount)}
                      </p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status !== "PAID" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busy && !rowBusy}
                          loading={rowBusy}
                          loadingLabel="Marking paid"
                          onClick={() => void markPaid(item.id)}
                        >
                          <Check aria-hidden size={16} />
                          Mark paid
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        aria-label={`Delete ${item.title}`}
                        onClick={() => void remove(item)}
                        className="text-bad hover:bg-bad-soft hover:text-bad"
                      >
                        <Trash2 aria-hidden size={17} />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <aside className="space-y-4">
          <section
            className={cn(
              "rounded-[1.25rem] border p-5 shadow-sm",
              earningGap > 0
                ? "border-warn/30 bg-warn-soft"
                : "border-good/30 bg-good-soft",
            )}
          >
            <Target
              aria-hidden
              size={22}
              className={earningGap > 0 ? "text-warn" : "text-good"}
            />
            <h2 className="brut-label mt-4">Minimum earning target</h2>
            <p className="num mt-2 text-4xl font-bold tracking-[-0.03em] text-ink">
              {formatCurrency(earningGap)}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              {earningGap > 0
                ? "Extra settled income needed in the low case to cover commitments, work costs, and your buffer."
                : "Your low-case forecast covers the current protected plan."}
            </p>
          </section>
          <Card className="p-5">
            <Clock3 aria-hidden size={22} className="text-accent-ink" />
            <h2 className="brut-label mt-4">Next known events</h2>
            {dashboard.timeline.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">
                Nothing scheduled yet. Add a commitment or income source to see
                what is coming.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {dashboard.timeline.slice(0, 4).map((event) => (
                  <li key={event.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex justify-between gap-3">
                      <strong className="text-sm font-semibold text-ink">
                        {event.title}
                      </strong>
                      <span className="num whitespace-nowrap text-sm font-bold text-ink">
                        {event.amountMin === event.amountMax
                          ? formatCurrency(event.amountMin)
                          : `${formatCurrency(event.amountMin)}–${formatCurrency(event.amountMax)}`}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                      <span>{formatDate(event.date)}</span>
                      <Badge>{humanize(event.status)}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      <section
        aria-labelledby="scenario-heading"
        className="rounded-[1.5rem] bg-primary p-5 text-on-primary shadow-lg sm:p-6"
      >
        <div className="flex items-start gap-3">
          <Gauge aria-hidden className="mt-1 text-accent-on-primary" size={24} />
          <div>
            <p className="brut-label text-on-primary-soft">Scenario tester</p>
            <h2
              id="scenario-heading"
              className="brut-display mt-1 text-3xl text-on-primary"
            >
              What if the month changes?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-primary-soft">
              This is a private planning calculation. It does not change your
              saved data.
            </p>
          </div>
        </div>

        <div
          role="group"
          aria-label="Scenario presets"
          className="mt-5 flex flex-wrap gap-2"
        >
          {PRESETS.map((preset) => {
            const active = sameScenario(scenario, preset.value);
            return (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                aria-pressed={active}
                onClick={() => setScenario(preset.value)}
                className={cn(
                  "rounded-full border-on-primary/30 text-on-primary hover:border-on-primary/60 hover:bg-on-primary/10 hover:text-on-primary focus-visible:outline-accent-on-primary",
                  active &&
                    "border-accent-on-primary bg-accent-soft text-accent-ink hover:border-accent-on-primary hover:bg-accent-soft hover:text-accent-ink",
                )}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <Range
            label="Income change"
            min={-50}
            max={30}
            step={5}
            value={scenario.incomeChangePct}
            format={(value) => `${value > 0 ? "+" : ""}${value}%`}
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
            format={(value) => `${value} ${value === 1 ? "day" : "days"}`}
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
            format={formatCurrency}
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
            format={(value) => `${value} ${value === 1 ? "day" : "days"}`}
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
            format={(value) => `${value > 0 ? "+" : ""}${value}%`}
            onChange={(value) =>
              setScenario((current) => ({
                ...current,
                workCostChangePct: value,
              }))
            }
          />
        </div>

        <div className="mt-6 grid gap-4 rounded-2xl border border-on-primary/15 bg-on-primary/10 p-4 sm:grid-cols-2 xl:grid-cols-4">
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
            hint="Extra settled income needed so bills, work costs and your buffer stay covered in the low case."
          />
          <ForecastDark
            label="Target / workday"
            value={formatCurrency(scenarioResult.targetPerRemainingWorkday)}
            hint="The verified gap split across the workdays left this month."
          />
          <div className="sm:col-span-2">
            <p className="brut-label text-on-primary-soft">
              Recommended action
            </p>
            <p className="mt-1 font-semibold leading-6 text-accent-on-primary">
              {scenarioResult.recommendedAction}
            </p>
            <p role="status" className="sr-only">
              {announcedAction}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-on-primary/15 bg-on-primary/10 p-4">
            <p className="brut-label text-on-primary-soft">Payments at risk</p>
            {scenarioResult.atRiskCommitments.length ? (
              <ul className="mt-3 divide-y divide-on-primary/20">
                {scenarioResult.atRiskCommitments.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0"
                  >
                    <span className="font-medium">
                      {item.title} · {formatDate(item.dueDate)}
                    </span>
                    <span className="num font-semibold text-accent-on-primary">
                      {formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-6 text-on-primary-soft">
                No recorded commitment becomes uncovered in this scenario.
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-on-primary/15 bg-on-primary/10 p-4">
            <p className="brut-label text-on-primary-soft">Try before credit</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-on-primary-soft">
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

const CHART_WIDTH = 400;
const CHART_HEIGHT = 100;

const ForecastChart = memo(function ForecastChart({
  dashboard,
}: {
  dashboard: GigDashboardDto;
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
    (index / Math.max(1, dashboard.forecast.length - 1)) * CHART_WIDTH;
  const y = (value: number) => 94 - ((value - min) / span) * 84;
  const line = (key: "actual" | "conservative" | "typical" | "optimistic") =>
    dashboard.forecast
      .map((point, index) => {
        const value = point[key];
        return value === null ? null : `${x(index)},${y(value)}`;
      })
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
  const floorY = y(dashboard.profile.safetyBuffer);
  const belowFloor =
    dashboard.summary.lowestProjectedBalanceLow < dashboard.profile.safetyBuffer;
  const actualDays = dashboard.forecast.filter(
    (point) => point.actual !== null,
  ).length;
  const projectedDays = dashboard.forecast.length - actualDays;

  return (
    <Card className="p-5">
      <CardHeader
        eyebrow="Balance forecast"
        title={`${actualDays} actual ${actualDays === 1 ? "day" : "days"} + ${projectedDays} projected`}
        action={
          <Badge variant={belowFloor ? "warn" : "good"}>
            {humanize(dashboard.summary.forecastConfidence)} confidence
          </Badge>
        }
      />
      <ul
        aria-label="Chart legend"
        className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-ink-soft"
      >
        <Legend stroke="var(--ink)" width={2.5} label="Actual balance" />
        <Legend stroke="var(--accent-bg)" width={2} label="Typical forecast" />
        <Legend
          stroke="var(--good)"
          fill="var(--good-soft)"
          dash="4 3"
          label="Forecast range"
        />
        <Legend stroke="var(--bad)" dash="6 4" label="Safety floor" />
      </ul>
      <div className="mt-4 min-w-0 overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-64 w-full rounded-xl bg-paper-2"
          role="img"
          aria-label={`Balance forecast. Conservative lowest balance ${formatCurrency(dashboard.summary.lowestProjectedBalanceLow)}, optimistic lowest balance ${formatCurrency(dashboard.summary.lowestProjectedBalanceHigh)}, safety floor ${formatCurrency(dashboard.profile.safetyBuffer)}.`}
        >
          <line
            x1="0"
            x2={CHART_WIDTH}
            y1={floorY}
            y2={floorY}
            stroke="var(--bad)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
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
            strokeWidth="1.5"
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={line("optimistic")}
            fill="none"
            stroke="var(--good)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={line("typical")}
            fill="none"
            stroke="var(--accent-bg)"
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={line("actual")}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Forecast
          label="Lowest conservative balance"
          value={formatCurrency(dashboard.summary.lowestProjectedBalanceLow)}
          detail="Low-income case"
          tone={belowFloor ? "bad" : "good"}
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
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        The shaded area is uncertainty, not money already received. Update
        source ranges when work patterns change.
      </p>
    </Card>
  );
});

/** Legend swatch drawn with the same stroke the chart uses, so it matches in both themes. */
function Legend({
  stroke,
  fill,
  dash,
  width = 1.5,
  label,
}: {
  stroke: string;
  fill?: string;
  dash?: string;
  width?: number;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <svg aria-hidden width="24" height="12" viewBox="0 0 24 12">
        {fill ? (
          <rect
            x="1"
            y="1"
            width="22"
            height="10"
            rx="2"
            fill={fill}
            stroke={stroke}
            strokeWidth={width}
            strokeDasharray={dash}
          />
        ) : (
          <line
            x1="0"
            x2="24"
            y1="6"
            y2="6"
            stroke={stroke}
            strokeWidth={width}
            strokeDasharray={dash}
            strokeLinecap="round"
          />
        )}
      </svg>
      {label}
    </li>
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
      className={cn(
        "rounded-[1.25rem] border p-5 shadow-sm",
        tone === "bad"
          ? "border-bad/30 bg-bad-soft"
          : tone === "good"
            ? "border-good/30 bg-good-soft"
            : "border-line bg-surface",
      )}
    >
      <p className="brut-label">{label}</p>
      <p className="num mt-2 text-2xl font-bold tracking-[-0.02em] text-ink">
        {value}
      </p>
      <p className="mt-2 text-sm text-ink-soft">{detail}</p>
    </div>
  );
}

function ForecastDark({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="brut-label text-on-primary-soft">{label}</p>
      <p className="num mt-1 text-2xl font-bold tracking-[-0.02em] text-on-primary">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-sm leading-5 text-on-primary-soft">{hint}</p>
      )}
    </div>
  );
}

function ActionError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-bad/40 bg-bad-soft p-3 text-sm font-medium text-bad sm:col-span-2"
    >
      <AlertTriangle aria-hidden size={16} className="mt-0.5 shrink-0" />
      {message}
    </p>
  );
}

/** Slider used on the navy scenario card. */
function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  const id = useId();
  const display = format(value);
  return (
    <div className="grid gap-2">
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-3 text-sm font-medium text-on-primary-soft"
      >
        <span>{label}</span>
        <output
          htmlFor={id}
          className="num font-semibold text-accent-on-primary"
        >
          {display}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full cursor-pointer accent-accent-on-primary"
      />
    </div>
  );
}
