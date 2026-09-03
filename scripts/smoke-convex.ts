import { existsSync } from "node:fs";
import process from "node:process";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

const convex = new ConvexHttpClient(required(process.env.NEXT_PUBLIC_CONVEX_URL, "NEXT_PUBLIC_CONVEX_URL"));
const serverKey = required(process.env.SUPERFINZ_SERVER_KEY, "SUPERFINZ_SERVER_KEY");
const email = "convex-smoke@example.test";

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  await convex.mutation(api.testing.removeSmokeTestUser, { serverKey, email });
  try {
    const user = await convex.mutation(api.superfinz.upsertGoogleUser, {
      serverKey,
      email,
      googleId: "smoke-test-google-id",
      name: "Convex Smoke Test",
    });
    check(user.email === email && user.onboarded === false, "Google user upsert failed");

    const completed = await convex.mutation(api.superfinz.completeProfile, {
      serverKey,
      userId: user.id,
      age: 27,
      userType: "PROFESSIONAL",
      incomeSources: ["FREELANCE"],
      monthlySalary: 60_000,
      monthlyBudget: 35_000,
      savingsGoal: 10_000,
      spendingPattern: "BALANCED",
      cycleStartDate: 1,
    });
    check(completed, "Profile completion failed");

    const hydratedUser = await convex.query(api.superfinz.getUser, { serverKey, id: user.id });
    check(hydratedUser?.onboarded && hydratedUser.profile?.monthlyBudget === 35_000, "User/profile read failed");

    const now = new Date();
    const budget = await convex.mutation(api.superfinz.upsertBudget, {
      serverKey,
      userId: user.id,
      category: "Food",
      limit: 5_000,
      month: now.getUTCMonth() + 1,
      year: now.getUTCFullYear(),
    });
    check(budget.spent === 0, "Budget upsert failed");

    const transaction = await convex.mutation(api.superfinz.createTransaction, {
      serverKey,
      userId: user.id,
      amount: 425,
      category: "Food",
      description: "Smoke test meal",
      date: now.getTime(),
    });
    await convex.mutation(api.superfinz.annotateTransaction, {
      serverKey,
      userId: user.id,
      id: transaction.id,
      isNecessary: false,
      aiNote: "Smoke test note",
    });

    const transactionList = await convex.query(api.superfinz.listTransactions, {
      serverKey,
      userId: user.id,
      descending: true,
    });
    check(transactionList.total === 1 && transactionList.transactions[0]?.aiNote === "Smoke test note", "Transaction flow failed");

    const updatedBudget = await convex.query(api.superfinz.getBudget, {
      serverKey,
      userId: user.id,
      category: "Food",
      month: now.getUTCMonth() + 1,
      year: now.getUTCFullYear(),
    });
    check(updatedBudget?.spent === 425, "Atomic budget increment failed");

    const goal = await convex.mutation(api.superfinz.createGoal, {
      serverKey,
      userId: user.id,
      title: "Emergency Buffer",
      targetAmount: 100_000,
      isEssential: true,
    });
    const updatedGoal = await convex.mutation(api.superfinz.updateGoal, {
      serverKey,
      userId: user.id,
      id: goal.id,
      savedAmount: 12_500,
    });
    check(updatedGoal?.savedAmount === 12_500, "Goal flow failed");
    let rejectedCrossUserAllocation = false;
    try {
      await convex.mutation(api.superfinz.applyGoalAllocations, {
        serverKey,
        userId: "not-the-owner",
        allocations: [{ id: goal.id, amount: 1_000 }],
      });
    } catch {
      rejectedCrossUserAllocation = true;
    }
    check(rejectedCrossUserAllocation, "Goal ownership protection failed");
    const splitGoals = await convex.mutation(api.superfinz.applyGoalAllocations, {
      serverKey,
      userId: user.id,
      allocations: [{ id: goal.id, amount: 2_500 }],
    });
    check(splitGoals[0]?.savedAmount === 15_000, "Atomic Smart Split failed");

    const nextPayoutAt = Date.now() + 3 * 86_400_000;
    const gigBundle = await convex.mutation(api.gig.completeOnboarding, {
      serverKey, userId: user.id, preferredName: "Convex Worker", city: "Chennai", preferredLanguage: "English", workTypes: ["DELIVERY"], primaryPriority: "STABLE_WEEKLY_SPENDING", lowWeekIncome: 4_000, typicalWeekIncome: 6_000, goodWeekIncome: 8_000, workDaysPerWeek: 6, platformDeductionRate: 10, weeklyWorkCosts: 1_200, openingBalance: 6_800, currentCushion: 600, safetyBuffer: 600, cushionTargetDays: 30,
      sources: [{ name: "Delivery platform", type: "PLATFORM_PAYOUT", frequency: "WEEKLY", typicalMin: 2_100, typicalMax: 3_400, nextPayoutAt, connectionMode: "MANUAL", prototype: true }],
      commitments: [{ title: "Rent", category: "Rent", amount: 4_000, dueDate: Date.now() + 2 * 86_400_000, recurrence: "MONTHLY", essential: true, priority: 1, autopay: false }],
      splitRule: { essentialsPct: 55, workCostsPct: 15, emergencyPct: 10, longTermPct: 5, flexiblePct: 15, enabled: true },
    });
    check(gigBundle?.profile.currentBalance === 6_800 && gigBundle.sources.length === 1, "Gig onboarding failed");
    const gigSource = gigBundle.sources[0];
    const payout = await convex.mutation(api.gig.applyPayoutSplit, { serverKey, userId: user.id, sourceId: gigSource.id, sourceName: gigSource.name, amount: 3_200, receivedAt: Date.now(), percentages: { essentialsPct: 55, workCostsPct: 15, emergencyPct: 10, longTermPct: 5, flexiblePct: 15 } });
    check(payout.essentialsAmount + payout.workCostsAmount + payout.emergencyAmount + payout.longTermAmount + payout.flexibleAmount === 3_200, "Payout split rounding failed");
    const expense = await convex.mutation(api.gig.createEntry, { serverKey, userId: user.id, kind: "WORK_EXPENSE", amount: 350, category: "Fuel", paymentMethod: "UPI", workRelated: true, status: "SETTLED", date: Date.now() });
    const afterGigActivity = await convex.query(api.gig.getBundle, { serverKey, userId: user.id });
    check(afterGigActivity?.profile.currentBalance === 9_650, "Gig cashbook balance failed");
    check(afterGigActivity?.pockets.find((pocket) => pocket.kind === "WORK_COSTS")?.currentAmount === 130, "Gig pocket debit failed");
    const payoutEntry = afterGigActivity?.entries.find((entry) => entry.payoutSplitId === payout.id);
    check(Boolean(payoutEntry), "Payout cashbook link failed");
    let rejectedPayoutDeletion = false;
    try { await convex.mutation(api.gig.deleteEntry, { serverKey, userId: user.id, id: payoutEntry!.id }); } catch { rejectedPayoutDeletion = true; }
    check(rejectedPayoutDeletion, "Payout split deletion protection failed");
    const paid = await convex.mutation(api.gig.markCommitmentPaid, { serverKey, userId: user.id, id: gigBundle.commitments[0].id, paidAt: Date.now() });
    check(paid?.status === "DUE" && new Date(paid.dueDate).getTime() > nextPayoutAt, "Recurring commitment rollover failed");
    const removedExpense = await convex.mutation(api.gig.deleteEntry, { serverKey, userId: user.id, id: expense.id });
    check(removedExpense, "Gig entry deletion failed");
    const afterExpenseRemoval = await convex.query(api.gig.getBundle, { serverKey, userId: user.id });
    check(afterExpenseRemoval?.pockets.find((pocket) => pocket.kind === "WORK_COSTS")?.currentAmount === 480, "Gig pocket reversal failed");

    const sessionId = await convex.mutation(api.superfinz.createMobileSession, {
      serverKey,
      userId: user.id,
      refreshTokenHash: "smoke-test-refresh-hash",
      expiresAt: Date.now() + 60_000,
    });
    const session = await convex.query(api.superfinz.getMobileSession, { serverKey, id: sessionId });
    check(session?.userId === user.id, "Mobile session flow failed");

    const rotated = await convex.mutation(api.superfinz.rotateMobileSession, {
      serverKey,
      id: sessionId,
      oldRefreshTokenHash: "smoke-test-refresh-hash",
      newRefreshTokenHash: "smoke-test-refresh-hash-rotated",
      expiresAt: Date.now() + 120_000,
    });
    check(rotated, "Mobile session rotation failed");
    const revoked = await convex.mutation(api.superfinz.revokeMobileSession, {
      serverKey,
      refreshTokenHash: "smoke-test-refresh-hash-rotated",
    });
    check(revoked === 1, "Mobile session revocation failed");

    const deleted = await convex.mutation(api.superfinz.deleteTransaction, {
      serverKey,
      userId: user.id,
      id: transaction.id,
    });
    check(deleted, "Transaction deletion failed");
    const revertedBudget = await convex.query(api.superfinz.getBudget, {
      serverKey,
      userId: user.id,
      category: "Food",
      month: now.getUTCMonth() + 1,
      year: now.getUTCFullYear(),
    });
    check(revertedBudget?.spent === 0, "Atomic budget reversal failed");

    console.log("Convex smoke test passed: auth, ownership, legacy import surface, gig onboarding, cashbook, commitments, pockets, sessions, and atomic payout splits.");
  } finally {
    await convex.mutation(api.testing.removeSmokeTestUser, { serverKey, email });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
