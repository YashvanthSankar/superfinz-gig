import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateGigDashboard,
  DEFAULT_GIG_PREFERENCES,
  deriveGigNotifications,
  recommendAdaptiveSplit,
  simulateGigScenario,
  validateTabTransaction,
  type GigBundleDto,
} from "./gig";

test("virtual tab transactions require an unlocked tab with enough funds", () => {
  assert.deepEqual(
    validateTabTransaction({ balance: 250, isLocked: false }, 250),
    { ok: true },
  );
  assert.deepEqual(
    validateTabTransaction({ balance: 250, isLocked: true }, 25),
    { ok: false, error: "TAB_LOCKED" },
  );
  assert.deepEqual(
    validateTabTransaction({ balance: 25, isLocked: false }, 30),
    { ok: false, error: "INSUFFICIENT_FUNDS" },
  );
});

const now = new Date("2026-09-03T06:00:00.000Z");
const bundle: GigBundleDto = {
  profile: {
    id: "profile",
    userId: "user",
    preferredName: "Ravi",
    city: "Chennai",
    preferredLanguage: "English",
    workTypes: ["DELIVERY"],
    primaryPriority: "STABLE_WEEKLY_SPENDING",
    lowWeekIncome: 4_000,
    typicalWeekIncome: 6_000,
    goodWeekIncome: 8_000,
    workDaysPerWeek: 6,
    platformDeductionRate: 10,
    weeklyWorkCosts: 1_200,
    openingBalance: 6_800,
    currentBalance: 6_800,
    safetyBuffer: 600,
    cushionTargetDays: 30,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  sources: [
    {
      id: "source",
      userId: "user",
      name: "Delivery platform",
      type: "PLATFORM_PAYOUT",
      frequency: "WEEKLY",
      typicalMin: 2_100,
      typicalMax: 3_400,
      payoutDay: 5,
      nextPayoutAt: "2026-09-05T06:00:00.000Z",
      connectionMode: "MANUAL",
      status: "ACTIVE",
      prototype: true,
      consentAt: null,
      consentExpiresAt: null,
      lastSyncAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ],
  entries: [],
  commitments: [
    {
      id: "rent",
      userId: "user",
      title: "Rent",
      category: "Rent",
      amount: 4_000,
      dueDate: "2026-09-05T05:00:00.000Z",
      recurrence: "MONTHLY",
      essential: true,
      priority: 1,
      autopay: false,
      fundedAmount: 0,
      status: "DUE",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ],
  pockets: [
    {
      id: "cushion",
      userId: "user",
      kind: "EMERGENCY_CUSHION",
      currentAmount: 200,
      targetAmount: 15_000,
      updatedAt: now.toISOString(),
    },
  ],
  splitRule: {
    id: "rule",
    userId: "user",
    essentialsPct: 55,
    workCostsPct: 15,
    emergencyPct: 10,
    longTermPct: 5,
    flexiblePct: 15,
    enabled: true,
    updatedAt: now.toISOString(),
  },
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

test("flexible bills do not reduce protected safe-to-spend money", () => {
  const flexibleBill = {
    ...bundle.commitments[0],
    id: "streaming",
    title: "Streaming",
    amount: 1_000,
    essential: false,
  };
  const dashboard = calculateGigDashboard(
    { ...bundle, commitments: [...bundle.commitments, flexibleBill] },
    now,
  );
  const recommendation = recommendAdaptiveSplit(
    { ...bundle, commitments: [...bundle.commitments, flexibleBill] },
    5_000,
    now,
  );
  assert.equal(dashboard.summary.dueBeforeNextPayout, 4_000);
  assert.ok(
    recommendation.fundedCommitments.every((item) => item.id !== "streaming"),
  );
});

test("work costs are protected across a fortnightly payout gap", () => {
  const dashboard = calculateGigDashboard(
    {
      ...bundle,
      sources: bundle.sources.map((source) => ({
        ...source,
        frequency: "FORTNIGHTLY",
        nextPayoutAt: "2026-09-17T06:00:00.000Z",
      })),
    },
    now,
  );
  assert.equal(dashboard.summary.workCostsBeforeNextPayout, 2_400);
});

test("a delayed payout scenario protects bills that become due in the delay", () => {
  const billDuringDelay = {
    ...bundle.commitments[0],
    id: "school-fee",
    title: "School fee",
    amount: 1_000,
    dueDate: "2026-09-06T06:00:00.000Z",
  };
  const dashboard = calculateGigDashboard(
    { ...bundle, commitments: [...bundle.commitments, billDuringDelay] },
    now,
  );
  const delayed = simulateGigScenario(dashboard, {
    incomeChangePct: 0,
    payoutDelayDays: 2,
    surpriseCost: 0,
    workDaysOff: 0,
    workCostChangePct: 0,
  });
  assert.equal(delayed.safeToSpend, 400);
});

test("protected pocket funding is not deducted twice", () => {
  const dashboard = calculateGigDashboard(
    {
      ...bundle,
      pockets: [
        {
          id: "essentials",
          userId: "user",
          kind: "ESSENTIALS",
          currentAmount: 4_000,
          targetAmount: 4_000,
          updatedAt: now.toISOString(),
        },
        {
          id: "work",
          userId: "user",
          kind: "WORK_COSTS",
          currentAmount: 400,
          targetAmount: 1_200,
          updatedAt: now.toISOString(),
        },
        {
          id: "cushion",
          userId: "user",
          kind: "EMERGENCY_CUSHION",
          currentAmount: 600,
          targetAmount: 15_000,
          updatedAt: now.toISOString(),
        },
      ],
    },
    now,
  );
  assert.equal(dashboard.summary.protectedMoney, 5_000);
  assert.equal(dashboard.summary.safeToSpend, 1_800);
});

test("partially funded bills still protect their remaining amount", () => {
  const dashboard = calculateGigDashboard(
    {
      ...bundle,
      commitments: bundle.commitments.map((commitment) => ({
        ...commitment,
        fundedAmount: 3_200,
      })),
      pockets: [
        {
          id: "essentials",
          userId: "user",
          kind: "ESSENTIALS",
          currentAmount: 3_200,
          targetAmount: 4_000,
          updatedAt: now.toISOString(),
        },
        ...bundle.pockets,
      ],
    },
    now,
  );
  assert.equal(dashboard.summary.dueBeforeNextPayout, 800);
  assert.equal(dashboard.summary.protectedMoney, 5_000);
  assert.equal(dashboard.summary.safeToSpend, 1_800);
});

test("weekly totals include every recorded cost without changing net work earnings", () => {
  const dashboard = calculateGigDashboard(
    {
      ...bundle,
      entries: [
        {
          id: "income",
          userId: "user",
          kind: "INCOME",
          amount: 3_000,
          sourceId: null,
          sourceName: "Platform",
          category: "Payout",
          paymentMethod: "PLATFORM",
          note: null,
          workRelated: false,
          status: "SETTLED",
          date: now.toISOString(),
          createdAt: now.toISOString(),
        },
        {
          id: "fuel",
          userId: "user",
          kind: "WORK_EXPENSE",
          amount: 300,
          sourceId: null,
          sourceName: null,
          category: "Fuel",
          paymentMethod: "UPI",
          note: null,
          workRelated: true,
          status: "PAID",
          date: now.toISOString(),
          createdAt: now.toISOString(),
        },
        {
          id: "groceries",
          userId: "user",
          kind: "ESSENTIAL_EXPENSE",
          amount: 500,
          sourceId: null,
          sourceName: null,
          category: "Groceries",
          paymentMethod: "CASH",
          note: null,
          workRelated: false,
          status: "PAID",
          date: now.toISOString(),
          createdAt: now.toISOString(),
        },
      ],
    },
    now,
  );
  assert.equal(dashboard.summary.grossIncomeWeek, 3_000);
  assert.equal(dashboard.summary.workCostsWeek, 300);
  assert.equal(dashboard.summary.allCostsWeek, 800);
  assert.equal(dashboard.summary.cashChangeWeek, 2_200);
  assert.equal(dashboard.summary.trueNetIncomeWeek, 2_700);
});

test("adaptive split fills urgent commitments before flexible spending", () => {
  const recommendation = recommendAdaptiveSplit(bundle, 3_200, now);
  const amountTotal = Object.values(recommendation.amounts).reduce(
    (sum, value) => sum + value,
    0,
  );
  const percentTotal = Object.values(recommendation.percentages).reduce(
    (sum, value) => sum + value,
    0,
  );
  assert.equal(amountTotal, 3_200);
  assert.equal(percentTotal, 100);
  assert.equal(recommendation.amounts.essentials, 3_200);
  assert.equal(recommendation.amounts.flexible, 0);
  assert.equal(recommendation.fundedCommitments[0]?.id, "rent");
});

test("adaptive split changes after obligations and work costs are funded", () => {
  const funded = {
    ...bundle,
    pockets: [
      {
        id: "essentials",
        userId: "user",
        kind: "ESSENTIALS" as const,
        currentAmount: 4_000,
        targetAmount: 4_000,
        updatedAt: now.toISOString(),
      },
      {
        id: "work",
        userId: "user",
        kind: "WORK_COSTS" as const,
        currentAmount: 1_200,
        targetAmount: 1_200,
        updatedAt: now.toISOString(),
      },
      {
        id: "cushion",
        userId: "user",
        kind: "EMERGENCY_CUSHION" as const,
        currentAmount: 2_000,
        targetAmount: 15_000,
        updatedAt: now.toISOString(),
      },
    ],
  };
  const recommendation = recommendAdaptiveSplit(funded, 3_200, now);
  assert.ok(recommendation.amounts.flexible > 0);
  assert.ok(recommendation.amounts.emergency > 0);
  assert.equal(
    Object.values(recommendation.amounts).reduce(
      (sum, value) => sum + value,
      0,
    ),
    3_200,
  );
});

test("scenario engine updates the whole plan and identifies risk", () => {
  const dashboard = calculateGigDashboard(bundle, now);
  const result = simulateGigScenario(dashboard, {
    incomeChangePct: -20,
    payoutDelayDays: 2,
    surpriseCost: 2_500,
    workDaysOff: 1,
    workCostChangePct: 10,
  });
  assert.ok(result.safeToSpend < dashboard.summary.safeToSpend);
  assert.ok(
    result.forecastIncomeLow30d < dashboard.summary.forecastIncomeLow30d,
  );
  assert.ok(
    result.lowestProjectedBalance < dashboard.summary.lowestProjectedBalanceLow,
  );
  assert.ok(result.earningTarget > 0);
  assert.ok(result.atRiskCommitments.length > 0);
});

test("worker alerts stay useful, respect preferences, and never promote credit", () => {
  const dashboard = calculateGigDashboard(bundle, now);
  const preferences = {
    userId: "user",
    ...DEFAULT_GIG_PREFERENCES,
    updatedAt: now.toISOString(),
  };
  const notifications = deriveGigNotifications(dashboard, preferences, [], now);
  assert.ok(notifications.length > 0);
  assert.ok(
    notifications.every(
      (item) =>
        !/(loan|borrow|credit offer|apply now)/i.test(
          `${item.title} ${item.body}`,
        ),
    ),
  );

  const first = notifications[0];
  assert.ok(first);
  const hidden = deriveGigNotifications(
    dashboard,
    preferences,
    [
      {
        key: first.id,
        readAt: now.toISOString(),
        dismissedAt: now.toISOString(),
        snoozedUntil: null,
      },
    ],
    now,
  );
  assert.ok(!hidden.some((item) => item.id === first.id));

  const payoutsOnly = deriveGigNotifications(
    dashboard,
    { ...preferences, alertCategories: ["PAYOUTS"] },
    [],
    now,
  );
  assert.ok(payoutsOnly.every((item) => item.category === "PAYOUTS"));
  assert.deepEqual(
    deriveGigNotifications(
      dashboard,
      { ...preferences, inAppEnabled: false },
      [],
      now,
    ),
    [],
  );
});
