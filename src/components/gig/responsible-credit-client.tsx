"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { simulateGigScenario, type GigDashboardDto } from "@superfinz/shared";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ResponsibleCreditClient({
  dashboard,
}: {
  dashboard: GigDashboardDto;
}) {
  const [urgentCost, setUrgentCost] = useState(2500);
  const [showTerms, setShowTerms] = useState(false);
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
  const principal = Math.min(5000, result.earningTarget);
  const apr = 18;
  const months = 3;
  const interest = Math.round((((principal * apr) / 100) * months) / 12);
  const fee = Math.round(principal * 0.01);
  const feeTax = Math.round(fee * 0.18);
  const netDisbursed = Math.max(0, principal - fee - feeTax);
  const totalRepayment = principal + interest;
  const installment = Math.ceil(totalRepayment / months);
  return (
    <section className="brut-card-lg p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden size={25} />
        <div>
          <p className="brut-label">Urgent work-cost check</p>
          <h2 className="brut-display mt-1 text-3xl">
            Find the smallest safe step.
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-ink-soft">
            Try the non-credit steps first. Credit details stay hidden unless
            this plan still shows a real gap.
          </p>
        </div>
      </div>
      <label className="mt-5 grid max-w-md gap-2">
        <span className="flex justify-between text-xs font-black uppercase">
          <span>Urgent repair or work cost</span>
          <strong className="num text-accent">
            {formatCurrency(urgentCost)}
          </strong>
        </span>
        <input
          type="range"
          min={0}
          max={10000}
          step={250}
          value={urgentCost}
          onChange={(event) => {
            setUrgentCost(Number(event.target.value));
            setShowTerms(false);
          }}
          className="h-11 w-full accent-accent"
        />
      </label>
      <div
        className={`mt-4 border-2 border-ink p-4 ${result.earningTarget > 0 ? "bg-warn-soft" : "bg-good-soft"}`}
        aria-live="polite"
      >
        <p className="brut-label">Verified gap after the scenario</p>
        <p className="num mt-1 text-3xl font-black">
          {formatCurrency(result.earningTarget)}
        </p>
        <p className="mt-2 text-sm font-semibold">
          {result.earningTarget > 0
            ? `${result.atRiskCommitments.map((item) => item.title).join(", ") || "The safety buffer"} may be uncovered. Do not borrow more than this verified gap.`
            : "Your current protected plan can absorb this cost. No credit comparison is needed."}
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
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
      {result.earningTarget > 0 && !showTerms && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="brut-btn min-h-12 bg-ink text-paper"
          >
            Compare a simulated last resort
          </button>
          <span className="text-xs font-bold text-ink-soft">
            No application. No lender is connected.
          </span>
        </div>
      )}
      {showTerms && principal > 0 && (
        <div className="mt-5 border-2 border-ink bg-paper-2 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="brut-label">
                Simulated credit comparison · not an offer
              </p>
              <h3 className="mt-1 text-xl font-black">
                Regulated partner placeholder
              </h3>
            </div>
            <span className="brut-stamp bg-warn-soft">
              Eligibility not checked
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="border-2 border-ink bg-paper p-4">
              <p className="brut-label">Example schedule</p>
              <ul className="mt-3 space-y-2 text-sm font-bold">
                {Array.from({ length: months }, (_, index) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() + index + 1);
                  return (
                    <li key={index} className="flex justify-between gap-2">
                      <span>{formatDate(date.toISOString())}</span>
                      <span className="num">
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
              <p className="mt-3 text-xs font-semibold text-ink-soft">
                Illustrative late charge: ₹100 per missed installment. A real
                partner must provide the signed Key Fact Statement and exact
                penalty policy before consent.
              </p>
            </div>
            <div className="border-2 border-ink bg-paper p-4">
              <p className="brut-label">Data and rights</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-semibold">
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
            <button
              type="button"
              onClick={() => setShowTerms(false)}
              className="brut-btn min-h-12 bg-paper"
            >
              Not now
            </button>
            <button
              type="button"
              disabled
              className="brut-btn min-h-12 bg-paper"
            >
              Application unavailable in prototype
            </button>
            <p className="flex items-center gap-2 text-xs font-black text-good">
              <ShieldCheck size={16} />
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
    <div className="border-2 border-ink bg-paper p-4">
      <span className="brut-stamp bg-accent-soft">Step {number}</span>
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-ink-soft">
        {copy}
      </p>
    </div>
  );
}
function Term({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t-2 border-ink pt-2">
      <p className="brut-label">{label}</p>
      <p className="num mt-1 font-black">{value}</p>
    </div>
  );
}
