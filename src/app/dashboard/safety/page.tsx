import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { calculateGigDashboard } from "@superfinz/shared";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getGigBundle } from "@/lib/gig-store";
import { cn, formatCurrency } from "@/lib/utils";
import { Disclosure } from "@/components/ui/disclosure";
import { PageHeading } from "@/components/gig/page-state";
import { ResponsibleCreditClient } from "@/components/gig/responsible-credit-client";

export const metadata: Metadata = { title: "Safety" };

const pocketNames: Record<string, string> = {
  ESSENTIALS: "Bills and essentials",
  WORK_COSTS: "Work money",
  EMERGENCY_CUSHION: "Emergency cushion",
  LONG_TERM_SAVINGS: "Long-term savings",
  FLEXIBLE_SPENDING: "Flexible spending",
};

const mainPocketKinds = new Set([
  "ESSENTIALS",
  "WORK_COSTS",
  "EMERGENCY_CUSHION",
]);

export default async function SafetyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const bundle = await getGigBundle(session.userId);
  if (!bundle) redirect("/onboarding");
  const dashboard = calculateGigDashboard(bundle);
  const s = dashboard.summary;
  const protectedDays = Math.floor(s.protectedDays);
  const mainPockets = dashboard.pockets.filter((pocket) =>
    mainPocketKinds.has(pocket.kind),
  );
  const otherPockets = dashboard.pockets.filter(
    (pocket) => !mainPocketKinds.has(pocket.kind),
  );
  const weakest = [...dashboard.resilienceFactors].sort(
    (a, b) => a.score - b.score,
  )[0];

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeading
        eyebrow="Your safety money"
        title={`${formatCurrency(s.protectedMoney)} is kept aside.`}
        copy={`This money protects bills, work costs, and about ${protectedDays} emergency ${protectedDays === 1 ? "day" : "days"}. SuperFinz plans it but never moves money.`}
      />

      <section
        aria-labelledby="kept-safe-heading"
        className="grid gap-4 md:grid-cols-3"
      >
        <h2 id="kept-safe-heading" className="sr-only">
          Money kept safe
        </h2>
        {mainPockets.map((pocket) => (
          <PocketCard key={pocket.id} pocket={pocket} />
        ))}
      </section>

      {weakest && (
        <section
          aria-labelledby="safer-heading"
          className="rounded-[1.25rem] border border-accent/20 bg-accent-soft p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck
              aria-hidden
              className="mt-0.5 shrink-0 text-accent-ink"
              size={22}
            />
            <div>
              <p className="brut-label">One way to get safer</p>
              <h2
                id="safer-heading"
                className="mt-2 text-xl font-bold tracking-[-0.02em] text-ink"
              >
                {weakest.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                {weakest.action}
              </p>
              <p className="mt-2 text-sm text-mute">{weakest.evidence}</p>
            </div>
          </div>
        </section>
      )}

      <Disclosure
        title="See my full safety check"
        summary={`${s.resilienceScore}/100 · ${s.resilienceStatus}`}
      >
        <div className="rounded-2xl bg-primary p-5 text-on-primary shadow-md">
          <p className="text-sm font-semibold text-on-primary-soft">
            Overall safety check
          </p>
          <p className="num mt-1 text-4xl font-bold tracking-[-0.03em]">
            {s.resilienceScore}/100
          </p>
          <p className="mt-1 text-sm leading-6 text-on-primary-soft">
            {s.resilienceStatus}. This is a planning check, not a credit score.
          </p>
        </div>
        <ul className="mt-4 space-y-3">
          {dashboard.resilienceFactors.map((factor) => (
            <li
              key={factor.key}
              className="rounded-2xl border border-line bg-paper-2 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-ink">{factor.label}</h3>
                <span className="num text-sm font-semibold text-ink">
                  {factor.score}/100
                </span>
              </div>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-3"
                role="progressbar"
                aria-label={`${factor.label} score`}
                aria-valuenow={factor.score}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(0, Math.min(100, factor.score))}%` }}
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                {factor.evidence}
              </p>
            </li>
          ))}
        </ul>
      </Disclosure>

      <Disclosure
        title="Other money goals and data safety"
        summary="Long-term savings, flexible spending, and what SuperFinz never reads."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {otherPockets.map((pocket) => (
            <PocketCard key={pocket.id} pocket={pocket} nested />
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-paper-2 p-4">
          <LockKeyhole
            aria-hidden
            className="mt-0.5 shrink-0 text-accent-ink"
            size={20}
          />
          <div>
            <h3 className="font-semibold text-ink">
              Your private data stays limited
            </h3>
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              SuperFinz does not read contacts, messages, call logs, photos, or
              social graphs. Expected payouts are shown separately from money
              already received.
            </p>
          </div>
        </div>
      </Disclosure>

      <Disclosure
        title="I have an urgent work cost"
        summary="Check simple non-loan options first. A loan comparison appears only when the plan finds a real gap."
      >
        <ResponsibleCreditClient dashboard={dashboard} />
      </Disclosure>
    </div>
  );
}

function PocketCard({
  pocket,
  nested = false,
}: {
  pocket: { kind: string; currentAmount: number; targetAmount: number };
  nested?: boolean;
}) {
  const percent = pocket.targetAmount
    ? Math.min(100, (pocket.currentAmount / pocket.targetAmount) * 100)
    : 100;
  const name = pocketNames[pocket.kind] ?? pocket.kind;
  return (
    <article
      className={cn(
        nested
          ? "rounded-2xl border border-line bg-paper-2 p-4"
          : "brut-card p-5",
      )}
    >
      <h3 className="text-sm font-semibold text-ink-soft">{name}</h3>
      <p className="num mt-2 text-2xl font-bold tracking-[-0.02em] text-ink">
        {formatCurrency(pocket.currentAmount)}
      </p>
      <div
        className={cn(
          "mt-4 h-2 overflow-hidden rounded-full",
          nested ? "bg-paper-3" : "bg-paper-2",
        )}
        role="progressbar"
        aria-label={`${name} progress`}
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${Math.round(percent)}% of ${formatCurrency(pocket.targetAmount)}`}
      >
        <div
          className="h-full rounded-full bg-good"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-mute">
        Goal {formatCurrency(pocket.targetAmount)}
      </p>
    </article>
  );
}
