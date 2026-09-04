"use client";

import { useId, useMemo, useState } from "react";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { simulateGigScenario, type GigDashboardDto } from "@superfinz/shared";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SLIDER_MIN = 0;
const SLIDER_MAX = 10_000;

export function ResponsibleCreditClient({
  dashboard,
}: {
  dashboard: GigDashboardDto;
}) {
  const [urgentCost, setUrgentCost] = useState(2500);
  const [showTerms, setShowTerms] = useState(false);
  const sliderId = useId();
  const headingId = useId();
  const result = useMemo(
    () =>
      simulateGigScenario(dashboard, {
        incomeChangePct: 0,
        payoutDelayDays: 0,
        surpriseCost: urgentCost,
        workDaysOff: 0,
        workCostChangePct: 0,
      }),
    [dashboard, urgentCost],
  );
  const hasGap = result.earningTarget > 0;
  const principal = Math.min(5000, result.earningTarget);
  const apr = 18;
  const months = 3;
  const interest = Math.round((((principal * apr) / 100) * months) / 12);
  const fee = Math.round(principal * 0.01);
  const feeTax = Math.round(fee * 0.18);
  const netDisbursed = Math.max(0, principal - fee - feeTax);
  const totalRepayment = principal + interest;
  const installment = Math.ceil(totalRepayment / months);
  const costLabel = formatCurrency(urgentCost);

  return (
    <section aria-labelledby={headingId} className="space-y-5">
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden size={24} className="mt-1 shrink-0 text-warn" />
        <div>
          <p className="brut-label">Urgent work-cost check</p>
          <h2
            id={headingId}
            className="mt-1 text-2xl font-bold tracking-[-0.02em] text-ink"
          >
            Find the smallest safe step.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
            Try the non-credit steps first. Credit details stay hidden unless
            this plan still shows a real gap.
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <label
          htmlFor={sliderId}
          className="flex items-baseline justify-between gap-3 text-sm font-medium text-ink-soft"
        >
          <span>Urgent repair or work cost</span>
          <output
            htmlFor={sliderId}
            className="num text-base font-semibold text-accent-ink"
          >
            {costLabel}
          </output>
        </label>
        <input
          id={sliderId}
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={250}
          value={urgentCost}
          aria-valuetext={costLabel}
          onChange={(event) => {
            setUrgentCost(Number(event.target.value));
            setShowTerms(false);
          }}
          className="mt-2 h-11 w-full cursor-pointer accent-accent"
        />
        <p className="num flex justify-between text-xs text-mute" aria-hidden>
          <span>{formatCurrency(SLIDER_MIN)}</span>
          <span>{formatCurrency(SLIDER_MAX)}</span>
        </p>
      </div>

      <div
        className={cn(
          "rounded-2xl border p-4",
          hasGap
            ? "border-warn/30 bg-warn-soft"
            : "border-good/30 bg-good-soft",
        )}
      >
        <p className="brut-label">Verified gap after this cost</p>
        <p
          className={cn(
            "num mt-1 text-3xl font-bold tracking-[-0.03em]",
            hasGap ? "text-warn" : "text-good",
          )}
        >
          {formatCurrency(result.earningTarget)}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Extra settled income you would still need so bills, work costs and
          your buffer stay covered.
        </p>
        <p role="status" className="mt-2 text-sm font-medium leading-6 text-ink">
          {hasGap
            ? `${result.atRiskCommitments.map((item) => item.title).join(", ") || "The safety buffer"} may be uncovered. Do not borrow more than this verified gap.`
            : "Your current protected plan can absorb this cost. No credit comparison is needed."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Alternative
          number="1"
          title="Move a flexible bill"
          copy="Ask for a later date before the bill is missed."
        />
        <Alternative
          number="2"
          title="Set a short target"
          copy={`${formatCurrency(result.targetPerRemainingWorkday)} net per remaining workday.`}
        />
        <Alternative
          number="3"
          title="Use only what is needed"
          copy="Use flexible money, then the smallest cushion amount."
        />
        <Alternative
          number="4"
          title="Check support"
          copy="Review e-Shram and insurance support before debt."
        />
      </div>

      {hasGap && !showTerms && (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={() => setShowTerms(true)}>
            Compare a simulated last resort
          </Button>
          <span className="text-sm font-medium text-ink-soft">
            No application. No lender is connected.
          </span>
        </div>
      )}

      {showTerms && principal > 0 && (
        <div className="rounded-2xl border border-line bg-paper-2 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="brut-label">
                Simulated credit comparison · not an offer
              </p>
              <h3 className="mt-1 text-xl font-bold tracking-[-0.02em] text-ink">
                Regulated partner placeholder
              </h3>
            </div>
            <Badge variant="warn">Eligibility not checked</Badge>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Term label="Principal" value={formatCurrency(principal)} />
            <Term label="APR" value={`${apr}%`} />
            <Term
              label="Interest · 3 months"
              value={formatCurrency(interest)}
            />
            <Term
              label="Processing fee"
              value={`${formatCurrency(fee)} + ${formatCurrency(feeTax)} tax`}
            />
            <Term label="Net received" value={formatCurrency(netDisbursed)} />
            <Term
              label="Total repayment"
              value={formatCurrency(totalRepayment)}
            />
            <Term
              label="3 installments"
              value={`${formatCurrency(installment)} each`}
            />
            <Term label="Cooling-off" value="3 days · simulated" />
          </dl>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="brut-label">Example schedule</p>
              <ul className="mt-3 divide-y divide-line text-sm font-medium text-ink">
                {Array.from({ length: months }, (_, index) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() + index + 1);
                  return (
                    <li
                      key={index}
                      className="flex justify-between gap-2 py-2 first:pt-0 last:pb-0"
                    >
                      <span>{formatDate(date)}</span>
                      <span className="num font-semibold">
                        {formatCurrency(
                          index === months - 1
                            ? totalRepayment - installment * (months - 1)
                            : installment,
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Illustrative late charge: {formatCurrency(100)} per missed
                installment. A real partner must provide the signed Key Fact
                Statement and exact penalty policy before consent.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="brut-label">Data and rights</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-soft">
                <li>
                  Would use only consented income ranges, settled entries, work
                  costs, commitments, and repayment capacity.
                </li>
                <li>
                  Never contacts, messages, call logs, photos, or social graphs.
                </li>
                <li>
                  A real regulated partner must provide grievance details,
                  cancellation, human review, and RBI complaint escalation.
                </li>
                <li>
                  The Resilience Passport is not a bureau score or automatic
                  approval.
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setShowTerms(false)}>
              Not now
            </Button>
            <Button variant="secondary" disabled>
              Application unavailable in prototype
            </Button>
            <p className="flex items-center gap-2 text-sm font-semibold text-good">
              <ShieldCheck aria-hidden size={16} />
              No loan request or data transfer occurs.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function Alternative({
  number,
  title,
  copy,
}: {
  number: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper-2 p-4">
      <Badge variant="accent">Step {number}</Badge>
      <h3 className="mt-3 font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-ink-soft">{copy}</p>
    </div>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-line pt-2">
      <dt className="brut-label">{label}</dt>
      <dd className="num mt-1 font-semibold text-ink">{value}</dd>
    </div>
  );
}
