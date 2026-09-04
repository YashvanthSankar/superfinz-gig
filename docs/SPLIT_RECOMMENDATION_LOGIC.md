# Split Recommendation Logic

SuperFinz treats a payout split as a planning recommendation, not an automatic transfer. The recommendation is calculated by `recommendAdaptiveSplit` in `packages/shared/src/gig.ts`, so the web app, mobile app, and tests can use the same pure logic.

## Inputs

The calculation uses:

- The payout amount.
- Essential commitments due before the next likely payout.
- How much of those commitments is already funded.
- Work costs needed before the next payout.
- The current essentials, work-cost, and emergency pocket balances.
- The safety-buffer target and protected-day estimate.
- Forecast confidence.
- The user's saved five-bucket percentages.

All values are estimates from the user's records. They are not bank-verified data and are not used as credit underwriting.

## Decision Order

The recommendation works in two passes.

### 1. Protect known near-term needs

Money is taken from the payout in this order:

1. The remaining gap for essential commitments due before the next payout.
2. The remaining work-cost gap, including fuel, fees, maintenance, or supplies.
3. An emergency-cushion step.

The emergency step is the smaller of one protected day's cost and the amount needed to reach the configured safety buffer. When forecast confidence is low, the recommendation also reserves 10% of the payout; with medium confidence it reserves 5%.

Each protected amount is capped by the remaining payout, so the recommendation never allocates more money than the payout contains.

### 2. Distribute what remains

After urgent protection, the remaining amount follows the user's saved percentages for essentials, work costs, emergency cushion, and long-term savings. Flexible spending receives the final remainder rather than an independently rounded amount. This makes flexible spending the balancing bucket and preserves the exact payout total.

The result includes both rupee amounts and percentages recalculated from those amounts. Percentages are rounded only after the amounts have been decided.

## Commitment Funding

Essential commitments are sorted by user priority and then due date. The recommendation reports which commitments would receive funding, without marking them paid or moving money. A payout mutation can later record the user's confirmed decision.

## Explainability

The result includes short reasons tied to the decisions above:

- Commitments are due before the next likely payout.
- Work costs need protection so the user can continue earning.
- The emergency cushion adds protected days.
- If none of those conditions apply, the saved default rule guides the payout.

The UI should show these reasons before confirmation and allow the user to edit the split. The user's preference has priority; the explanation is guidance, not a forced override.

## Invariants

The implementation and tests should preserve these rules:

- Every bucket amount is non-negative.
- The five bucket amounts add exactly to the payout amount after currency rounding.
- The five percentages add to 100% after percentage rounding.
- Essentials are considered before flexible spending.
- Work costs are protected before discretionary spending.
- A recommendation never creates credit, promises income, or performs a real-money transfer.
- A zero or invalid payout cannot create a positive allocation.

## Test Coverage

The shared tests cover adaptive recommendations that:

- Fund urgent commitments before flexible spending.
- Change when obligations and work costs are already funded.
- Preserve the payout total across rounded amounts.
- Keep the recommendation consistent with the dashboard's safety calculations.
