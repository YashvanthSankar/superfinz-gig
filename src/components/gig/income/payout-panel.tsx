"use client";

import {
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { ArrowRight, Check, CirclePlus, ShieldCheck } from "lucide-react";
import {
  projectPayoutSplit,
  recommendAdaptiveSplit,
  type GigDashboardDto,
  type SplitPercentages,
} from "@superfinz/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { localDateString } from "../use-gig-dashboard";
import {
  pct,
  preciseTotal,
  splitFields,
  type PayoutForm,
  type Projection,
} from "./model";
import { ActionError, Panel } from "./panel";

export type PayoutSubmission = {
  sourceId: string;
  sourceName: string;
  amount: number;
  receivedAt: string;
  note: string | null;
  allocationMode: PayoutForm["allocationMode"];
  percentages: SplitPercentages;
};

export function PayoutPanel({
  dashboard,
  activeSources,
  payout,
  setPayout,
  customSplit,
  setCustomSplit,
  confirmed,
  setConfirmed,
  busy,
  error,
  onClose,
  onSubmit,
  onAddSource,
}: {
  dashboard: GigDashboardDto;
  activeSources: GigDashboardDto["sources"];
  payout: PayoutForm;
  setPayout: Dispatch<SetStateAction<PayoutForm>>;
  customSplit: SplitPercentages | null;
  setCustomSplit: Dispatch<SetStateAction<SplitPercentages | null>>;
  confirmed: boolean;
  setConfirmed: (value: boolean) => void;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (submission: PayoutSubmission) => void;
  onAddSource: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const payoutAmount = Number(payout.amount) || 0;
  const selectedSource =
    activeSources.find((item) => item.id === payout.sourceId) ??
    activeSources[0];
  const adaptive = payout.allocationMode === "ADAPTIVE";

  const receivedAt = useMemo(
    () => new Date(`${payout.date || localDateString()}T12:00:00`),
    [payout.date],
  );
  const defaultSplit = useMemo<SplitPercentages>(
    () => ({
      essentialsPct: dashboard.splitRule.essentialsPct,
      workCostsPct: dashboard.splitRule.workCostsPct,
      emergencyPct: dashboard.splitRule.emergencyPct,
      longTermPct: dashboard.splitRule.longTermPct,
      flexiblePct: dashboard.splitRule.flexiblePct,
    }),
    [dashboard.splitRule],
  );
  const custom = customSplit ?? defaultSplit;
  const projection = useMemo<Projection>(
    () =>
      adaptive
        ? recommendAdaptiveSplit(dashboard, payoutAmount, receivedAt)
        : {
            ...projectPayoutSplit(dashboard, payoutAmount, custom, receivedAt),
            percentages: custom,
            fundedCommitments: [],
            reasons: ["Custom percentages selected by you."],
          },
    [adaptive, custom, dashboard, payoutAmount, receivedAt],
  );
  const allocation = projection.percentages;
  const splitTotal = splitFields.reduce(
    (sum, field) => sum + allocation[field.key],
    0,
  );
  const totalValid = Math.abs(splitTotal - 100) < 0.001;

  const setMode = (allocationMode: PayoutForm["allocationMode"]) => {
    setPayout((current) => ({ ...current, allocationMode }));
    setConfirmed(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!selectedSource) {
      setFormError("Add an active income source before recording a payout.");
      return;
    }
    if (payoutAmount <= 0) {
      setFormError("Enter the settled payout amount.");
      return;
    }
    if (!totalValid) {
      setFormError(
        `Your percentages total ${preciseTotal(splitTotal)}. Adjust them so they total exactly 100%.`,
      );
      return;
    }
    if (!confirmed) {
      setFormError("Tick the review box to confirm this plan.");
      return;
    }
    onSubmit({
      sourceId: selectedSource.id,
      sourceName: selectedSource.name,
      amount: payoutAmount,
      receivedAt: receivedAt.toISOString(),
      note: payout.note.trim() || null,
      allocationMode: payout.allocationMode,
      percentages: allocation,
    });
  };

  return (
    <Panel
      eyebrow="Plan this payout"
      title="Protect the important things first."
      description="Enter a payout only after it reaches you, then review where each rupee will go."
      busy={busy}
      onClose={onClose}
    >
      {activeSources.length === 0 ? (
        <EmptyState
          className="mt-0"
          icon={CirclePlus}
          title="No active income source yet"
          description="Payouts are recorded against a source so the forecast knows where money comes from. Add one first."
          action={
            <Button variant="accent" onClick={onAddSource}>
              <CirclePlus aria-hidden size={17} />
              Add income source
            </Button>
          }
        />
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <Select
            label="Active income source"
            required
            value={selectedSource?.id ?? ""}
            onChange={(event) =>
              setPayout((current) => ({
                ...current,
                sourceId: event.target.value,
              }))
            }
          >
            {activeSources.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Input
            label="Settled payout amount"
            hint="Settled means the money has actually landed, after platform deductions."
            type="number"
            prefix="₹"
            min={0}
            step="0.01"
            required
            value={payout.amount}
            onChange={(event) => {
              const amount = event.target.value;
              setPayout((current) => ({ ...current, amount }));
              setConfirmed(false);
            }}
          />
          <Input
            label="Received date"
            type="date"
            required
            value={payout.date}
            onChange={(event) => {
              const date = event.target.value;
              setPayout((current) => ({ ...current, date }));
            }}
          />
          <Input
            label="Note (optional)"
            value={payout.note}
            onChange={(event) => {
              const note = event.target.value;
              setPayout((current) => ({ ...current, note }));
            }}
          />

          <fieldset className="rounded-2xl border border-line bg-paper-2 p-4 lg:col-span-2">
            <legend className="brut-label px-1">Choose how to split</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <ModeButton
                active={adaptive}
                title="Recommended"
                copy="Protects your next bills, work costs, and emergency cushion first."
                onClick={() => setMode("ADAPTIVE")}
              />
              <ModeButton
                active={!adaptive}
                title="Custom"
                copy="Choose your own percentages. They must total 100%."
                onClick={() => setMode("CUSTOM")}
              />
            </div>
          </fieldset>

          {!adaptive && (
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-paper-2 p-4 lg:col-span-2 lg:grid-cols-5">
              {splitFields.map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  type="number"
                  suffix="%"
                  min={0}
                  max={100}
                  step="0.5"
                  required
                  value={String(custom[field.key])}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setCustomSplit((current) => ({
                      ...(current ?? custom),
                      [field.key]: value,
                    }));
                    setConfirmed(false);
                  }}
                />
              ))}
              <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 lg:col-span-5">
                <p
                  role="status"
                  className={cn(
                    "text-sm font-semibold",
                    totalValid ? "text-good" : "text-bad",
                  )}
                >
                  Total {preciseTotal(splitTotal)}
                  {totalValid ? "" : " · must total 100%"}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCustomSplit(null);
                    setConfirmed(false);
                  }}
                >
                  Reset to default
                </Button>
              </div>
            </div>
          )}

          {payoutAmount > 0 && (
            <div className="rounded-2xl border border-line bg-paper-2 p-4 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="brut-label">Review every rupee</p>
                  <h3 className="mt-1 text-xl font-bold tracking-[-0.02em]">
                    {adaptive
                      ? "Recommended for today"
                      : "Your custom allocation"}
                  </h3>
                </div>
                <Badge variant="good">
                  Totals {formatCurrency(payoutAmount)}
                </Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                {splitFields.map((field) => (
                  <div
                    key={field.key}
                    className="rounded-xl border border-line bg-surface p-3"
                  >
                    <dt className="text-xs font-semibold text-mute">
                      {field.label} · {pct(allocation[field.key])}
                    </dt>
                    <dd className="num mt-1 text-lg font-bold text-ink">
                      {formatCurrency(projection.amounts[field.amountKey])}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                <Compare
                  label="Safe to spend"
                  before={projection.beforeSafeAmount}
                  after={projection.afterSafeAmount}
                  money
                />
                <Compare
                  label="Protected days"
                  before={projection.beforeProtectedDays}
                  after={projection.afterProtectedDays}
                />
              </div>
              <ul className="mt-4 space-y-2 text-sm font-medium text-ink">
                {projection.reasons.map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <ShieldCheck
                      aria-hidden
                      size={17}
                      className="mt-0.5 shrink-0 text-good"
                    />
                    {reason}
                  </li>
                ))}
              </ul>
              {projection.fundedCommitments.length > 0 && (
                <p className="mt-3 rounded-xl bg-good-soft px-3 py-2 text-sm font-semibold text-good">
                  Protects:{" "}
                  {projection.fundedCommitments
                    .map(
                      (item) => `${item.title} ${formatCurrency(item.amount)}`,
                    )
                    .join(" · ")}
                </p>
              )}
            </div>
          )}

          <label className="flex min-h-12 items-start gap-3 rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm font-semibold text-ink shadow-sm lg:col-span-2">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
            />
            I reviewed the allocation. This records a plan and does not move
            bank money.
          </label>
          {(error ?? formError) && (
            <ActionError
              message={(error ?? formError) as string}
              className="lg:col-span-2"
            />
          )}
          <Button
            type="submit"
            size="lg"
            block
            loading={busy}
            loadingLabel="Applying"
            className="lg:col-span-2"
          >
            Confirm payout and split
          </Button>
        </form>
      )}
    </Panel>
  );
}

function ModeButton({
  active,
  title,
  copy,
  onClick,
}: {
  active: boolean;
  title: string;
  copy: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-20 rounded-2xl border p-4 text-left transition-colors duration-200",
        active
          ? "border-accent bg-accent-soft text-ink"
          : "border-line-strong bg-surface text-ink hover:bg-paper-2",
      )}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        {active && (
          <Check aria-hidden size={16} className="shrink-0 text-accent-ink" />
        )}
        {title}
      </span>
      <span className="mt-1 block text-sm text-ink-soft">{copy}</span>
    </button>
  );
}

function Compare({
  label,
  before,
  after,
  money = false,
}: {
  label: string;
  before: number;
  after: number;
  money?: boolean;
}) {
  const show = (value: number) =>
    money ? formatCurrency(value) : `${Math.round(value)} days`;
  return (
    <div>
      <p className="brut-label">{label}</p>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm font-medium text-ink-soft">
        <span className="num">{show(before)}</span>
        <ArrowRight aria-hidden size={15} className="shrink-0 text-mute" />
        <span className="sr-only">to</span>
        <strong className="num text-lg text-good">{show(after)}</strong>
      </p>
    </div>
  );
}
