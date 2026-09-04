import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ChartNoAxesCombined,
  CirclePlus,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import {
  QUICK_SETUP_DASHBOARD_COPY,
  type GigDashboardDto,
} from "@superfinz/shared";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { Disclosure } from "@/components/ui/disclosure";
import { cn, formatCurrency } from "@/lib/utils";

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
  const payoutHref = demo ? "/login" : "/dashboard/income?panel=payout";
  const insightsHref = demo ? "/demo/insights" : "/dashboard/insights";
  const coverDays = Math.floor(s.protectedDays);
  const personalized =
    QUICK_SETUP_DASHBOARD_COPY[dashboard.profile.primaryPriority];

  return (
    <div className="space-y-5 sm:space-y-6">
      <header>
        <p className="text-sm font-medium text-mute">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="brut-display mt-1 text-3xl sm:text-4xl">
          Hello, {dashboard.profile.preferredName}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-accent-ink">
            Your focus · {personalized.focus}
          </span>
          <p className="max-w-xl leading-7 text-ink-soft">
            {personalized.introduction}
          </p>
        </div>
      </header>

      <section
        className="overflow-hidden rounded-[1.5rem] bg-primary p-5 text-on-primary shadow-lg sm:p-7"
        aria-labelledby="safe-heading"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="safe-heading" className="text-sm font-semibold text-on-primary-soft">
              You can safely use
            </h2>
            <p className="num mt-1 text-5xl font-bold tracking-[-0.06em] sm:text-6xl">
              {formatCurrency(s.safeToSpend)}
            </p>
            <p className="mt-2 text-lg font-semibold text-on-primary-soft">
              until {nextDay}, without touching bills or work money
            </p>
          </div>
          <div className="rounded-2xl border border-on-primary/15 bg-on-primary/10 p-4 lg:min-w-64">
            <p className="brut-label text-on-primary-soft">
              Next payout estimate
            </p>
            <p className="num mt-1 text-xl font-bold">
              {formatCurrency(s.expectedPayoutMin)}–
              {formatCurrency(s.expectedPayoutMax)}
            </p>
            <p className="mt-1 text-xs text-on-primary-soft">
              Not counted until the money arrives
            </p>
          </div>
        </div>

        <Disclosure
          tone="plain"
          title="See how this was calculated"
          className="mt-6 border-t border-on-primary/20 pt-1"
        >
          <div className="max-w-lg space-y-2 text-sm text-on-primary-soft">
            <MoneyLine label="Money available" value={s.availableBalance} />
            <MoneyLine
              label="Kept aside for your plan"
              value={-s.protectedMoney}
            />
            <div className="border-t border-on-primary/20 pt-2">
              <MoneyLine label="Safe to use now" value={s.safeToSpend} strong />
            </div>
          </div>
        </Disclosure>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild variant="accent" size="xl">
          <Link href={moneyHref}>
            <CirclePlus aria-hidden size={20} />
            Add income or work cost
          </Link>
        </Button>
        <Button asChild variant="secondary" size="xl">
          <Link href={payoutHref}>
            <WalletCards aria-hidden size={20} />
            Plan a payout
          </Link>
        </Button>
      </div>

      <section
        className="rounded-[1.25rem] border border-line bg-accent-soft p-5 shadow-sm sm:p-6"
        aria-labelledby="next-step-title"
      >
        <p className="brut-label text-accent-ink">
          Best next step
        </p>
        <h2 id="next-step-title" className="mt-1 text-xl font-bold tracking-[-0.02em] sm:text-2xl">
          {dashboard.recommendation.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
          {dashboard.recommendation.body}
        </p>
        <Button asChild variant="primary" className="mt-4">
          <Link href={planHref}>
            {dashboard.recommendation.action}
            <ArrowRight aria-hidden size={16} />
          </Link>
        </Button>
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
          value={`${coverDays} ${coverDays === 1 ? "day" : "days"}`}
          detail={`Your goal is ${s.cushionTargetDays} days`}
          progress={Math.min(
            100,
            (s.protectedDays / s.cushionTargetDays) * 100,
          )}
        />
      </section>

      <section
        className="flex flex-col gap-5 rounded-[1.25rem] border border-line bg-accent-soft p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"
        aria-labelledby="plan-ahead-title"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-accent-ink shadow-sm">
            <ChartNoAxesCombined aria-hidden size={22} />
          </span>
          <div>
            <p className="brut-label text-accent-ink">
              Plan ahead
            </p>
            <h2 id="plan-ahead-title" className="mt-1 text-xl font-bold tracking-[-0.02em] sm:text-2xl">
              See the next 30 days before they happen.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              Check your runway, true take-home earnings, and common slow-week
              situations without crowding today&apos;s plan.
            </p>
          </div>
        </div>
        <Button asChild variant="primary" size="lg" className="shrink-0">
          <Link href={insightsHref}>
            Open insights
            <ArrowRight aria-hidden size={17} />
          </Link>
        </Button>
      </section>

      <section className="brut-card p-5 sm:p-6">
        <CardHeader
          eyebrow="Coming up"
          title="Your next money events"
          action={
            <CalendarClock aria-hidden size={22} className="text-accent-ink" />
          }
        />
        {nextEvents.length ? (
          <ul className="mt-4 divide-y divide-line">
            {nextEvents.map((event) => (
              <li
                key={event.id}
                className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-3 py-3"
              >
                <div className="min-w-0">
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
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-6 text-ink-soft">
            Add a payout date or bill to see what comes next.
          </p>
        )}
      </section>

      <Disclosure
        tone="card"
        title="More about my plan"
        summary="Income estimate, resilience check, and money kept aside"
      >
        <div className="grid gap-4 sm:grid-cols-3">
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
          <p className="mt-5 border-t border-line pt-4 text-sm leading-6 text-ink-soft">
            Latest payout plan: {formatCurrency(latest.amount)} from{" "}
            {latest.sourceName}. SuperFinz only planned it; no money was moved.
          </p>
        )}
      </Disclosure>

      <p className="text-xs leading-5 text-mute">
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
      className={cn(
        "flex justify-between gap-6",
        strong && "font-semibold text-on-primary",
      )}
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
      <div className="flex items-center gap-3 text-accent-ink">
        <Icon aria-hidden size={21} />
        <h3 className="text-sm font-semibold">{label}</h3>
      </div>
      <p className="num mt-3 text-3xl font-bold tracking-[-0.04em] text-ink">
        {value}
      </p>
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
      <p className="mt-3 text-sm leading-6 text-ink-soft">{detail}</p>
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
      <h3 className="brut-label">{label}</h3>
      <p className="num mt-1 text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs leading-5 text-ink-soft">{help}</p>
    </div>
  );
}
