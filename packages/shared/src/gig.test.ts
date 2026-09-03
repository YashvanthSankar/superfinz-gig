import assert from "node:assert/strict";
import test from "node:test";
import { calculateGigDashboard, type GigBundleDto } from "./gig";

const now = new Date("2026-09-03T06:00:00.000Z");
const bundle: GigBundleDto = {
  profile: { id: "profile", userId: "user", preferredName: "Ravi", city: "Chennai", preferredLanguage: "English", workTypes: ["DELIVERY"], primaryPriority: "STABLE_WEEKLY_SPENDING", lowWeekIncome: 4_000, typicalWeekIncome: 6_000, goodWeekIncome: 8_000, workDaysPerWeek: 6, platformDeductionRate: 10, weeklyWorkCosts: 1_200, openingBalance: 6_800, currentBalance: 6_800, safetyBuffer: 600, cushionTargetDays: 30, createdAt: now.toISOString(), updatedAt: now.toISOString() },
  sources: [{ id: "source", userId: "user", name: "Delivery platform", type: "PLATFORM_PAYOUT", frequency: "WEEKLY", typicalMin: 2_100, typicalMax: 3_400, payoutDay: 5, nextPayoutAt: "2026-09-05T06:00:00.000Z", connectionMode: "MANUAL", status: "ACTIVE", prototype: true, consentAt: null, consentExpiresAt: null, lastSyncAt: null, createdAt: now.toISOString(), updatedAt: now.toISOString() }],
  entries: [],
  commitments: [{ id: "rent", userId: "user", title: "Rent", category: "Rent", amount: 4_000, dueDate: "2026-09-05T05:00:00.000Z", recurrence: "MONTHLY", essential: true, priority: 1, autopay: false, fundedAmount: 0, status: "DUE", createdAt: now.toISOString(), updatedAt: now.toISOString() }],
  pockets: [{ id: "cushion", userId: "user", kind: "EMERGENCY_CUSHION", currentAmount: 200, targetAmount: 15_000, updatedAt: now.toISOString() }],
  splitRule: { id: "rule", userId: "user", essentialsPct: 55, workCostsPct: 15, emergencyPct: 10, longTermPct: 5, flexiblePct: 15, enabled: true, updatedAt: now.toISOString() },
  payoutSplits: [],
};

test("safe-to-spend protects commitments, work costs, and the safety buffer", () => {
  const dashboard = calculateGigDashboard(bundle, now);
  assert.equal(dashboard.summary.dueBeforeNextPayout, 4_000);
  assert.equal(dashboard.summary.workCostsBeforeNextPayout, 400);
  assert.equal(dashboard.summary.safetyBufferGap, 400);
  assert.equal(dashboard.summary.protectedMoney, 5_000);
  assert.equal(dashboard.summary.safeToSpend, 1_800);
  assert.equal(dashboard.summary.expectedPayoutMin, 2_100);
  assert.equal(dashboard.summary.expectedPayoutMax, 3_400);
});

test("protected pocket funding is not deducted twice", () => {
  const dashboard = calculateGigDashboard({ ...bundle, pockets: [
    { id: "essentials", userId: "user", kind: "ESSENTIALS", currentAmount: 4_000, targetAmount: 4_000, updatedAt: now.toISOString() },
    { id: "work", userId: "user", kind: "WORK_COSTS", currentAmount: 400, targetAmount: 1_200, updatedAt: now.toISOString() },
    { id: "cushion", userId: "user", kind: "EMERGENCY_CUSHION", currentAmount: 600, targetAmount: 15_000, updatedAt: now.toISOString() },
  ] }, now);
  assert.equal(dashboard.summary.protectedMoney, 5_000);
  assert.equal(dashboard.summary.safeToSpend, 1_800);
});
