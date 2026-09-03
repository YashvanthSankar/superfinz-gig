import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CirclePlus,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import type { GigDashboardDto } from "@superfinz/shared";
import { formatCurrency } from "@/lib/utils";

export function GigDashboardView({
  dashboard,
  demo = false,
}: {
  dashboard: GigDashboardDto;
  demo?: boolean;
}) {
  const s = dashboard.summary;
  const nextDay = new Date(s.safeUntil).toLocaleDateString("en-IN", {
    weekday: "long",
  });
  const nextEvents = dashboard.timeline.slice(0, 3);
  const latest = dashboard.payoutSplits[0];
  const planHref = demo ? "/login" : "/dashboard/plan";
  const moneyHref = demo ? "/login" : "/dashboard/income";

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-medium text-mute">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
          Hello, {dashboard.profile.preferredName}
        </h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Here is today&apos;s simple money plan.
        </p>
      </header>

      <section
        className="overflow-hidden rounded-[1.5rem] bg-ink p-5 text-paper shadow-[var(--shadow-hard-lg)] sm:p-7"
        aria-labelledby="safe-heading"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p id="safe-heading" className="text-sm font-semibold text-paper-2">
              You can safely use
            </p>
            <p className="num mt-1 text-5xl font-bold tracking-[-0.06em] sm:text-6xl">
              {formatCurrency(s.safeToSpend)}
            </p>
            <p className="mt-2 text-lg font-semibold text-paper-2">
              until {nextDay}, without touching bills or work money
            </p>
          </div>
          <div className="rounded-2xl border border-paper-2 bg-white/5 p-4 lg:min-w-64">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-paper-2">
              Next payout estimate
            </p>
            <p className="num mt-1 text-xl font-bold">
              {formatCurrency(s.expectedPayoutMin)}–
              {formatCurrency(s.expectedPayoutMax)}
            </p>
            <p className="mt-1 text-xs text-paper-2">
              Not counted until the money arrives
            </p>
          </div>
        </div>

        <details className="mt-6 border-t border-paper-2 pt-4">
          <summary className="w-fit text-sm font-semibold text-paper">
            See how this was calculated
          </summary>
          <div className="mt-4 max-w-lg space-y-2 text-sm text-paper-2">
            <MoneyLine label="Money available" value={s.availableBalance} />
            <MoneyLine
              label="Kept aside for your plan"
              value={-s.protectedMoney}
            />
            <div className="border-t border-paper-2 pt-2">
              <MoneyLine label="Safe to use now" value={s.safeToSpend} strong />
            </div>
          </div>
        </details>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={moneyHref}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-accent px-5 font-semibold text-paper shadow-[var(--shadow-sm)] transition hover:-translate-y-px hover:shadow-[var(--shadow-md)]"
        >
          <CirclePlus aria-hidden size={20} />
          Add income or work cost
        </Link>
        <Link
          href={demo ? "/login" : "/dashboard/income?panel=payout"}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-ink bg-surface px-5 font-semibold text-ink shadow-[var(--shadow-sm)] transition hover:bg-paper-2"
        >
          <WalletCards aria-hidden size={20} />
          Plan a payout
        </Link>
      </div>

      <section className="brut-card bg-accent-soft p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">
          Best next step
        </p>
        <h2 className="mt-2 text-xl font-bold sm:text-2xl">
          {dashboard.recommendation.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
          {dashboard.recommendation.body}
        </p>
        <Link
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-paper"
          href={planHref}
        >
          {dashboard.recommendation.action}
          <ArrowRight aria-hidden size={16} />
        </Link>
      </section>

      <section
        className="grid gap-4 md:grid-cols-2"
        aria-label="Your key numbers"
      >
        <SimpleCard
          icon={WalletCards}
          label="You kept this week"
          value={formatCurrency(s.trueNetIncomeWeek)}
          detail={`${formatCurrency(s.grossIncomeWeek)} earned, minus ${formatCurrency(s.workCostsWeek)} work costs`}
        />
        <SimpleCard
          icon={ShieldCheck}
          label="Emergency cover"
          value={`${Math.floor(s.protectedDays)} ${Math.floor(s.protectedDays) === 1 ? "day" : "days"}`}
          detail={`Your goal is ${s.cushionTargetDays} days`}
          progress={Math.min(
            100,
            (s.protectedDays / s.cushionTargetDays) * 100,
          )}
        />
      </section>

      <section className="brut-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-mute">
              Coming up
            </p>
            <h2 className="mt-1 text-xl font-bold">Your next money events</h2>
          </div>
          <CalendarClock aria-hidden size={22} className="text-accent" />
        </div>
        {nextEvents.length ? (
          <div className="mt-4 divide-y divide-ink">
            {nextEvents.map((event) => (
              <div
                key={event.id}
                className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-3 py-3"
              >
                <div>
                  <p className="font-semibold">{event.title}</p>
                  <p className="mt-0.5 text-sm text-mute">
                    {new Date(event.date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                    {event.type === "INCOME" ? " · expected" : " · due"}
                  </p>
                </div>
                <p className="num text-right font-semibold">
                  {event.amountMin === event.amountMax
                    ? formatCurrency(event.amountMin)
                    : `${formatCurrency(event.amountMin)}–${formatCurrency(event.amountMax)}`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">
            Add a payout date or bill to see what comes next.
          </p>
        )}
      </section>

      <details className="brut-card p-5 sm:p-6">
        <summary className="font-semibold">More about my plan</summary>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <SmallMetric
            label="30-day income estimate"
            value={`${formatCurrency(s.forecastIncomeLow30d)}–${formatCurrency(s.forecastIncomeHigh30d)}`}
            help={`${s.forecastConfidence.toLowerCase()} confidence`}
          />
          <SmallMetric
            label="Resilience check"
            value={`${s.resilienceScore}/100`}
            help={`${s.resilienceStatus} · not a credit score`}
          />
          <SmallMetric
            label="Money kept aside"
            value={formatCurrency(s.protectedMoney)}
            help="Bills, work costs, and safety buffer"
          />
        </div>
        {latest && (
          <p className="mt-5 border-t border-ink pt-4 text-sm text-ink-soft">
            Latest payout plan: {formatCurrency(latest.amount)} from{" "}
            {latest.sourceName}. SuperFinz only planned it; no money was moved.
          </p>
        )}
      </details>

      <p className="text-xs text-mute">
        Forecasts are estimates. SuperFinz is a planning prototype, not a bank
        or lender.
      </p>
    </div>
  );
}

function MoneyLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  const display = `${value < 0 ? "− " : ""}${formatCurrency(Math.abs(value))}`;
  return (
    <p
      className={`flex justify-between gap-6 ${strong ? "font-semibold text-paper" : ""}`}
    >
      <span>{label}</span>
      <span className="num font-semibold">{display}</span>
    </p>
  );
}

function SimpleCard({
  icon: Icon,
  label,
  value,
  detail,
  progress,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
  detail: string;
  progress?: number;
}) {
  return (
    <article className="brut-card p-5 sm:p-6">
      <div className="flex items-center gap-3 text-accent">
        <Icon aria-hidden size={21} />
        <p className="text-sm font-semibold">{label}</p>
      </div>
      <p className="num mt-3 text-3xl font-bold tracking-[-0.04em]">{value}</p>
      {progress !== undefined && (
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-paper-2"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="h-full rounded-full bg-good"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <p className="mt-3 text-sm text-ink-soft">{detail}</p>
    </article>
  );
}

function SmallMetric({
  label,
  value,
  help,
}: {
  label: string;
  value: string;
  help: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-mute">
        {label}
      </p>
      <p className="num mt-1 text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{help}</p>
    </div>
  );
}
