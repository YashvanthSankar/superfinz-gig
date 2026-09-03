# SuperFinz Credit System

## Executive position

SuperFinz should be an income-aware lending infrastructure layer for gig and
informal workers, not an instant-loan marketplace. Its job is to help a
regulated lending partner answer three separate questions:

1. Is there a real, time-bound liquidity gap after non-credit actions?
2. Can the worker repay the requested amount under a conservative income
   scenario?
3. Can repayment happen in small, transparent portions without taking away
   money needed for food, housing, dependants, or the next day's work?

The current product is consistent with this direction because its primary
decision is safe-to-spend, its expected income is separate from settled money,
and its credit comparison is explicitly simulated. A production credit system
must keep those boundaries.

## Why traditional personal loans underperform

### Fixed repayment versus variable cash flow

Personal loans normally assume a predictable monthly salary and a fixed EMI.
Gig workers may be paid daily, weekly, fortnightly, or irregularly. A fixed
date can therefore collide with a low-demand week, a platform delay, illness,
or a vehicle repair even when the worker is viable over a longer period.

### Thin-file underwriting

Salary slips, bureau history, bank statements, and employer records do not
capture cash income, UPI receipts, several small platform payouts, or the cost
of keeping a vehicle and phone operational. The result is either exclusion or
an expensive product priced for an information gap.

### Gross income is mistaken for repayment capacity

Platform deductions, fuel, maintenance, data, and equipment are production
costs. Underwriting on gross payouts can approve a loan that looks affordable
until true net income is calculated.

### Volatility is treated as failure

A low week is not necessarily delinquency risk. Traditional models can punish
irregularity without distinguishing seasonal variation, platform tenure,
multiple income sources, or a temporary shock with a credible recovery path.

### Collection methods can deepen the shock

Late fees, repeated calls, coercive contacts, and automatic debits from an
already depleted account can cause a worker to miss rent or stop working. A
collection system that protects repayment but removes the worker's earning
capacity is economically self-defeating.

## Proposed alternative underwriting

### 1. Verify the gap before assessing the loan

The maximum requested amount should be the smallest of:

- the verified shortfall after flexible bills, available flexible money, and
  the necessary cushion have been considered;
- the amount repayable under a conservative net-income forecast;
- the partner's product and policy limit.

Expected payouts must never be treated as cash already available. The worker
must see the scenario, assumptions, and non-credit actions before any offer.

### 2. Build an explainable reliability profile

Use a worker-facing **Income Reliability Profile**, not a hidden bureau-style
score. Suggested components are:

| Component | What it measures | Guardrail |
| --- | --- | --- |
| Settled earning history | Consistency of net settled earnings over 8-26 weeks | Show sample size and missing data |
| Platform tenure | Time since the worker began receiving payouts | Never use tenure alone as approval |
| Payout regularity | Arrival cadence, not just total income | Treat platform outages separately |
| Net-income stability | Variation after work costs and deductions | Do not penalize an unavoidable cost without context |
| Source diversity | Number of active, independently observed sources | Do not require multiple sources from low-access workers |
| Commitment coverage | Protected essentials covered before the next payout | Never convert coverage into permission to over-borrow |
| Cushion depth | Protected days under a conservative scenario | Preserve a minimum worker-controlled floor |
| Prior repayment behavior | Timely repayment with the partner, where consented | No dark-pattern cross-product sharing |

The score should produce reasons such as “12 of 14 weekly payouts settled on
time” and “repayment remains covered after a 20% lower-income scenario,” not an
opaque number. Protected traits, contacts, messages, call logs, photos, social
graphs, and their proxies must be excluded. Each applicant needs a data
inventory, consent receipt, correction path, human review, and adverse-action
explanation.

### 3. Use affordability bands, not a single approval number

The partner should receive a recommendation such as:

- **No offer:** the gap is absorbable or repayment would reduce protected
  essentials below the worker-controlled floor.
- **Small bridge:** short tenor and a capped amount for a verified work or
  essential shock.
- **Conditional offer:** only after a human or assisted review of missing or
  conflicting data.
- **Decline and support:** show rescheduling, benefits, earning targets, or
  hardship support instead of encouraging repeated applications.

The model should be monotonic in the important safety direction: higher
essential outflows or work costs must not improve affordability, and a larger
loan must not improve the score. Model monitoring should track approval,
repayment, hardship, repeat borrowing, complaints, and outcomes by relevant
cohorts without exposing protected attributes to the decision engine.

## Payout-linked repayment

### What changes

With the worker's explicit, revocable mandate, a regulated lender or licensed
payment partner can calculate a repayment allocation when a supported platform
payout settles. The platform payout API would send a settlement event to a
repayment orchestration service. That service would reserve only the agreed
repayment amount and release the remainder to the worker's chosen account.

```text
Platform payout
      |
      v
Settlement event + worker mandate + loan status
      |
      v
Repayment policy engine
      |-- protected-floor check
      |-- variable repayment cap
      |-- idempotency and ledger entry
      |-- worker notification and receipt
      v
Lender collection account  +  worker payout account
```

This can materially reduce risk because repayment is aligned to the actual
cash event rather than a calendar date. It reduces missed-EMI timing risk,
manual collection cost, payment-account failure, and the temptation to use a
new loan to cover an old fixed installment. It also gives the lender a direct,
auditable settlement record.

### Why interception is not automatically safe

“Intercepting funds” must not mean an unrestricted sweep. A payout is often
the worker's rent, food, fuel, and next day's earning capital. A production
design must therefore enforce:

- explicit opt-in mandate with plain-language amount, cap, duration, and
  revocation process;
- worker-selected protected floor before every deduction;
- percentage-of-settlement repayment with an absolute cap, never an unlimited
  fixed sweep;
- zero or minimal deduction on a payout below the hardship threshold;
- no deduction from protected benefits or legally restricted funds;
- partial-payment and delayed-settlement handling without duplicate charges;
- pause, hardship, dispute, cooling-off, and human support paths;
- clear pre- and post-deduction receipts showing gross payout, repayment,
  fees, and net received;
- idempotency keys, signed events, reconciliation, and a tamper-evident audit
  trail;
- separation of the platform, lender, and payment-partner responsibilities;
- no access to unrelated platform balances or other income sources without a
  separate consent and mandate.

The lender must remain responsible for disclosures, servicing, complaints,
data minimisation, and regulatory compliance. SuperFinz should provide the
worker-facing plan and consent experience and integrate only through approved
partners. It should not hold funds, represent a simulated offer as approval,
or make an automatic debit in the current prototype.

## Suggested service boundaries

```text
SuperFinz UI and calculations
  -> verified-gap and affordability recommendation
  -> worker consent, disclosures, hardship controls

Credit decision service owned by regulated partner
  -> policy decision, pricing, KFS, loan account, servicing

Payout integration owned by platform/payment partner
  -> signed settlement event, conditional allocation, settlement receipt

SuperFinz receives only the minimum status needed for the worker's plan
  -> offer status, repayment due/paid, outstanding balance, next action
```

Minimum event fields should include a unique event ID, worker and loan
references, platform source, gross settled amount, settlement timestamp,
currency, mandate version, deduction amount, net amount, and signature. Never
rely on a client callback to confirm a repayment.

## Consistency and quality review

### Strong and consistent today

- Safe-to-spend is the primary decision, not loan promotion.
- The verified-gap flow tries non-credit actions first.
- Gross income, work costs, settled balance, expected payouts, protected
  money, and resilience are distinct concepts.
- The current comparison discloses principal, APR, fees, total repayment,
  schedule, cooling-off, partner status, and grievance expectations.
- The app explicitly avoids contacts, messages, call logs, photos, and social
  graphs.
- The Resilience Passport is labelled as a planning indicator rather than a
  bureau score or automatic approval.

### Gaps before this can be real lending

- Platform tenure and an 8-26 week settled payout history are not yet modeled
  as underwriting inputs.
- There is no production credit application, partner decision API, loan
  ledger, mandate store, payout webhook, reconciliation worker, or repayment
  event history.
- Current income connections and credit are explicitly prototypes.
- The existing Smart Split plans money but does not move it; it must not be
  described as repayment interception.
- Affordability needs a formal repayment-cap calculation, hardship threshold,
  model version, override policy, and adverse-action reason codes.
- The mobile root route currently needs runtime verification for every credit
  entry point before parity is claimed.

### Overall assessment

The product concept is strong and unusually consistent with inclusive-lending
principles: **8/10 as a product direction, 7/10 as a prototype, and not yet
ready for live lending**. The biggest strength is the non-credit-first,
settled-income architecture. The biggest risk is presenting payout-linked
repayment as a simple default-control feature when it is actually a regulated,
high-consequence payment mandate. Keep that capability partner-owned,
worker-controlled, capped, observable, and reversible.

## Recommended delivery stages

1. **Prototype:** add reliability explanations and affordability bands using
   existing settled entries; keep all offers simulated.
2. **Pilot:** validate score explanations and hardship rules with workers and
   a regulated partner; run shadow decisions without changing approvals.
3. **Limited launch:** support one platform, one lender, and one payment rail
   with explicit mandates, signed events, reconciliation, complaints, and
   independent fairness monitoring.
4. **Scale:** add additional platforms only after measuring worker outcomes,
   not just repayment rate. A lower default rate is not success if it comes
   from harmful deductions or repeat borrowing.