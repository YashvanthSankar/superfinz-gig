"use client";

import { AlertTriangle, Scissors } from "lucide-react";
import type { CashEntryDto, GigDashboardDto } from "@superfinz/shared";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { formatDateTime, pct } from "./model";

export type IncomeAnalysis = ReturnType<typeof buildIncomeAnalysis>;

export function Overview({
  dashboard,
  analysis,
  onPayout,
}: {
  dashboard: GigDashboardDto;
  analysis: IncomeAnalysis;
  onPayout: (trigger?: HTMLElement) => void;
}) {
  const { summary } = dashboard;
  const sourceMax = Math.max(1, ...analysis.bySource.map((item) => item.amount));
  const dayMax = Math.max(1, ...analysis.byDay.map((item) => item.amount));

  return (
    <div className="space-y-5">
      <section aria-label="This week" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Gross this week"
          value={formatCurrency(summary.grossIncomeWeek)}
          detail={`${pct(summary.typicalWeekDeltaPct)} vs typical net`}
        />
        <Stat
          label="Cost to earn"
          value={formatCurrency(summary.workCostsWeek)}
          detail={`${pct(summary.workCostRatioPct)} of gross`}
          tone="warn"
        />
        <Stat
          label="True take-home"
          value={formatCurrency(summary.trueNetIncomeWeek)}
          detail="Gross minus work costs"
          tone="good"
        />
        <Stat
          label="Today"
          value={formatCurrency(summary.todayGrossIncome)}
          detail={`${summary.activeSourceCount} active ${summary.activeSourceCount === 1 ? "source" : "sources"} · updated ${formatDateTime(summary.dataFreshnessAt)}`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <article className="brut-card p-5">
          <CardHeader
            eyebrow="12-week earning pattern"
            title="Gross versus true net"
            action={
              <ul className="flex gap-4 text-sm font-medium text-ink-soft">
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="inline-block h-3 w-3 rounded-sm bg-accent" />
                  Gross
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="inline-block h-3 w-3 rounded-sm bg-good" />
                  Net
                </li>
              </ul>
            }
          />
          <WeeklyChart analysis={analysis} />
        </article>

        <article className="brut-card bg-accent-soft p-5">
          <CardHeader eyebrow="Forecast" title="Next expected payout" />
          <p className="num mt-3 text-3xl font-bold tracking-[-0.03em] text-ink">
            {formatCurrency(summary.expectedPayoutMin)}–
            {formatCurrency(summary.expectedPayoutMax)}
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Expected around {formatDate(summary.safeUntil)}. It is not included
            in today’s balance.
          </p>
          <Button
            size="lg"
            block
            className="mt-5"
            onClick={(event) => onPayout(event.currentTarget)}
          >
            <Scissors aria-hidden size={17} />
            Record when settled
          </Button>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <BarList
          title="Best earning days"
          rows={analysis.byDay}
          max={dayMax}
          color="bg-accent"
        />
        <BarList
          title="Source contribution"
          rows={analysis.bySource}
          max={sourceMax}
          color="bg-good"
        />
      </section>

      {summary.workCostRatioPct > 25 && (
        <section className="flex gap-3 rounded-2xl border border-warn/40 bg-warn-soft p-4">
          <AlertTriangle aria-hidden size={20} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <p className="font-semibold text-ink">
              Work costs are {pct(summary.workCostRatioPct)} of this week’s gross
              income.
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              Check fuel, fees and maintenance entries before deciding your true
              take-home.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function WeeklyChart({ analysis }: { analysis: IncomeAnalysis }) {
  const latest = analysis.weeks[analysis.weeks.length - 1];
  const best = analysis.weeks.reduce(
    (top, week) => (week.gross > top.gross ? week : top),
    analysis.weeks[0],
  );
  const summary = `Bar chart of gross and true net income for the last 12 weeks. Latest week (from ${latest.label}): gross ${formatCurrency(latest.gross)}, net ${formatCurrency(latest.net)}. Best week from ${best.label}: gross ${formatCurrency(best.gross)}. Exact values follow in a table.`;

  return (
    <figure className="mt-6">
      <div
        role="img"
        aria-label={summary}
        className="flex h-52 items-end gap-2 overflow-x-auto border-b border-line px-1"
      >
        {analysis.weeks.map((week) => (
          <div
            key={week.label}
            className="flex min-w-10 flex-1 flex-col items-center justify-end"
          >
            <div className="flex h-40 items-end gap-1">
              <span
                className="w-3 rounded-t-sm bg-accent"
                style={{ height: `${(week.gross / analysis.weekMax) * 100}%` }}
                title={`${week.label} gross ${formatCurrency(week.gross)}`}
              />
              <span
                className="w-3 rounded-t-sm bg-good"
                style={{
                  height: `${Math.max(1, (week.net / analysis.weekMax) * 100)}%`,
                }}
                title={`${week.label} net ${formatCurrency(week.net)}`}
              />
            </div>
            <span className="mt-2 whitespace-nowrap text-xs font-semibold text-mute">
              {week.label}
            </span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Weekly gross and true net income, last 12 weeks</caption>
        <thead>
          <tr>
            <th scope="col">Week starting</th>
            <th scope="col">Gross</th>
            <th scope="col">Net</th>
          </tr>
        </thead>
        <tbody>
          {analysis.weeks.map((week) => (
            <tr key={week.label}>
              <th scope="row">{week.label}</th>
              <td>{formatCurrency(week.gross)}</td>
              <td>{formatCurrency(week.net)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="mt-3 text-sm text-ink-soft">
        Net subtracts recorded work expenses from settled income.
      </figcaption>
    </figure>
  );
}

export function buildIncomeAnalysis(
  entries: CashEntryDto[],
  typicalWeek: number,
) {
  const weeks = Array.from({ length: 12 }, (_, index) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - (11 - index) * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const rows = entries.filter((item) => {
      const time = new Date(item.date);
      return time >= start && time <= end;
    });
    const gross = rows
      .filter((item) => item.kind === "INCOME" && item.status === "SETTLED")
      .reduce((sum, item) => sum + item.amount, 0);
    const costs = rows
      .filter(
        (item) =>
          item.kind === "WORK_EXPENSE" &&
          ["SETTLED", "PAID"].includes(item.status),
      )
      .reduce((sum, item) => sum + item.amount, 0);
    return {
      label: start.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      gross,
      net: Math.max(0, gross - costs),
    };
  });
  const byDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
    (label, index) => ({
      label,
      amount: entries
        .filter(
          (item) =>
            item.kind === "INCOME" && new Date(item.date).getDay() === index,
        )
        .reduce((sum, item) => sum + item.amount, 0),
    }),
  );
  const sourceMap = new Map<string, number>();
  entries
    .filter((item) => item.kind === "INCOME")
    .forEach((item) =>
      sourceMap.set(
        item.sourceName ?? "Other",
        (sourceMap.get(item.sourceName ?? "Other") ?? 0) + item.amount,
      ),
    );
  return {
    weeks,
    weekMax: Math.max(typicalWeek, 1, ...weeks.map((item) => item.gross)),
    byDay,
    bySource: [...sourceMap]
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount),
  };
}

function BarList({
  title,
  rows,
  max,
  color,
}: {
  title: string;
  rows: Array<{ label: string; amount: number }>;
  max: number;
  color: string;
}) {
  return (
    <article className="brut-card p-5">
      <CardHeader title={title} />
      <div className="mt-5 space-y-3">
        {rows.length ? (
          rows.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[5rem_1fr_auto] items-center gap-3"
            >
              <span className="truncate text-sm font-medium text-ink">
                {item.label}
              </span>
              <div
                aria-hidden
                className="h-3 overflow-hidden rounded-full bg-paper-3"
              >
                <div
                  className={cn("h-full rounded-full", color)}
                  style={{ width: `${(item.amount / max) * 100}%` }}
                />
              </div>
              <span className="num text-sm font-semibold text-ink">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-ink-soft">
            Record settled income to see this pattern.
          </p>
        )}
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "warn" | "good";
}) {
  return (
    <div
      className={cn(
        "brut-card p-5",
        tone === "warn" && "bg-warn-soft",
        tone === "good" && "bg-good-soft",
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
