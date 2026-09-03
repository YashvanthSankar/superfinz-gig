import { redirect } from "next/navigation";
import { calculateGigDashboard } from "@superfinz/shared";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getGigBundle } from "@/lib/gig-store";
import { formatCurrency } from "@/lib/utils";
import { PageHeading } from "@/components/gig/page-state";
import { ResponsibleCreditClient } from "@/components/gig/responsible-credit-client";

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
    <div className="space-y-6">
      <PageHeading
        eyebrow="Your safety money"
        title={`${formatCurrency(s.protectedMoney)} is kept aside.`}
        copy={`This money protects bills, work costs, and about ${Math.floor(s.protectedDays)} emergency ${Math.floor(s.protectedDays) === 1 ? "day" : "days"}. SuperFinz plans it but never moves money.`}
      />

      <section
        className="grid gap-4 md:grid-cols-3"
        aria-label="Money kept safe"
      >
        {mainPockets.map((pocket) => (
          <PocketCard key={pocket.id} pocket={pocket} />
        ))}
      </section>

      {weakest && (
        <section className="brut-card bg-accent-soft p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden className="mt-0.5 text-accent" size={22} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">
                One way to get safer
              </p>
              <h2 className="mt-2 text-xl font-bold">{weakest.label}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                {weakest.action}
              </p>
              <p className="mt-2 text-xs text-mute">{weakest.evidence}</p>
            </div>
          </div>
        </section>
      )}

      <details className="brut-card p-5 sm:p-6">
        <summary className="font-semibold">See my full safety check</summary>
        <div className="mt-5 rounded-2xl bg-ink p-5 text-paper">
          <p className="text-sm font-semibold text-paper-2">
            Overall safety check
          </p>
          <p className="num mt-1 text-4xl font-bold">{s.resilienceScore}/100</p>
          <p className="mt-1 text-sm text-paper-2">
            {s.resilienceStatus}. This is a planning check, not a credit score.
          </p>
        </div>
        <div className="mt-4 space-y-3">
          {dashboard.resilienceFactors.map((factor) => (
            <article
              key={factor.key}
              className="rounded-2xl border border-ink bg-paper p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold">{factor.label}</h3>
                <span className="num text-sm font-semibold">
                  {factor.score}/100
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{factor.evidence}</p>
            </article>
          ))}
        </div>
      </details>

      <details className="brut-card p-5 sm:p-6">
        <summary className="font-semibold">
          Other money goals and data safety
        </summary>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {otherPockets.map((pocket) => (
            <PocketCard key={pocket.id} pocket={pocket} />
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-paper-2 p-4">
          <LockKeyhole aria-hidden className="mt-0.5 text-accent" size={20} />
          <div>
            <h3 className="font-semibold">Your private data stays limited</h3>
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              SuperFinz does not read contacts, messages, call logs, photos, or
              social graphs. Expected payouts are shown separately from money
              already received.
            </p>
          </div>
        </div>
      </details>

      <details className="rounded-[1.25rem] border border-ink bg-surface p-5 shadow-[var(--shadow-sm)] sm:p-6">
        <summary className="font-semibold">I have an urgent work cost</summary>
        <p className="mt-2 text-sm text-ink-soft">
          Check simple non-loan options first. A loan comparison appears only
          when the plan finds a real gap.
        </p>
        <div className="mt-5">
          <ResponsibleCreditClient dashboard={dashboard} />
        </div>
      </details>
    </div>
  );
}

function PocketCard({
  pocket,
}: {
  pocket: { kind: string; currentAmount: number; targetAmount: number };
}) {
  const percent = pocket.targetAmount
    ? Math.min(100, (pocket.currentAmount / pocket.targetAmount) * 100)
    : 100;
  return (
    <article className="brut-card p-5">
      <p className="text-sm font-semibold text-ink-soft">
        {pocketNames[pocket.kind] ?? pocket.kind}
      </p>
      <p className="num mt-2 text-2xl font-bold">
        {formatCurrency(pocket.currentAmount)}
      </p>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-paper-2"
        role="progressbar"
        aria-label={`${pocketNames[pocket.kind]} progress`}
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
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
