import assert from "node:assert/strict";
import test from "node:test";
import {
  QUICK_SETUP_SPLITS,
  buildQuickOnboardingPayload,
  quickSetupSafetyBuffer,
  type QuickSetupDraft,
} from "./quick-onboarding";

const completeDraft: QuickSetupDraft = {
  preferredName: "Ravi",
  city: "Chennai",
  preferredLanguage: "Tamil",
  workTypes: ["DELIVERY"],
  sourceName: "Zomato",
  sourceType: "PLATFORM_PAYOUT",
  workDaysPerWeek: 6,
  lowWeekIncome: 3_000,
  typicalWeekIncome: 6_000,
  goodWeekIncome: 9_000,
  nextPayoutDate: "2026-09-11",
  weeklyWorkCosts: 1_200,
  openingBalance: 5_000,
  currentCushion: 1_000,
  commitments: [
    {
      title: "Electricity",
      amount: 900,
      dueDate: "2026-09-14",
      recurrence: "MONTHLY",
    },
  ],
  primaryPriority: "WORK_EXPENSES",
};

test("every quick-setup starter split totals 100 percent", () => {
  for (const split of Object.values(QUICK_SETUP_SPLITS)) {
    assert.equal(
      split.essentialsPct +
        split.workCostsPct +
        split.emergencyPct +
        split.longTermPct +
        split.flexiblePct,
      100,
    );
  }
});

test("quick setup builds a valid goal-based onboarding payload", () => {
  const payload = buildQuickOnboardingPayload(completeDraft);
  assert.equal(payload.splitRule.workCostsPct, 25);
  assert.equal(payload.safetyBuffer, 500);
  assert.equal(payload.commitments[0]?.title, "Electricity");
  assert.equal(payload.sources[0]?.name, "Zomato");
});

test("forgotten-expense buffer stays small but never disappears", () => {
  assert.equal(quickSetupSafetyBuffer(6_000), 500);
  assert.equal(quickSetupSafetyBuffer(500), 100);
});
