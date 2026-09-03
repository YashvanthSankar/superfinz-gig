import assert from "node:assert/strict";
import test from "node:test";
import { calculateFd, calculateFire, calculateSip } from "./calculators";
import { financePlanError, summarizeFinancePlan } from "./finance";
import { budgetInputSchema, transactionInputSchema } from "./schemas";

test("finance plans reject allocations above income", () => {
  const plan = summarizeFinancePlan({ monthlyIncome: 20_000, monthlyBudget: 15_000, savingsGoal: 6_000 });
  assert.equal(plan.remaining, -1_000);
  assert.equal(plan.overspent, true);
  assert.match(financePlanError({ monthlyIncome: 20_000, monthlyBudget: 15_000, savingsGoal: 6_000 }) ?? "", /greater than income/);
});

test("SIP, FD, and FIRE calculations retain their financial invariants", () => {
  const sip = calculateSip(5_000, 12, 10);
  assert.equal(sip.invested, 600_000);
  assert.ok(sip.value > sip.invested);
  const fd = calculateFd(100_000, 7, 5);
  assert.ok(fd.value > fd.invested);
  assert.equal(calculateFire(40_000), 12_000_000);
});

test("shared request contracts reject unsafe values", () => {
  assert.equal(transactionInputSchema.safeParse({ amount: -1, category: "Food", description: "x" }).success, false);
  assert.equal(budgetInputSchema.safeParse({ category: "Food", limit: 5_000, month: 13, year: 2026 }).success, false);
});
