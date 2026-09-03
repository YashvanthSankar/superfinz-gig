import assert from "node:assert/strict";
import test from "node:test";
import { createGigDemo } from "./gig-demo";

test("Ravi demo keeps the hackathon story internally consistent", () => {
  const dashboard = createGigDemo(new Date("2026-09-03T12:00:00.000Z"));
  assert.equal(dashboard.summary.availableBalance, 6_800);
  assert.equal(dashboard.summary.safeToSpend, 620);
  assert.deepEqual([dashboard.summary.expectedPayoutMin, dashboard.summary.expectedPayoutMax], [2_100, 3_400]);
  assert.equal(Math.floor(dashboard.summary.protectedDays), 12);
  assert.equal(dashboard.summary.resilienceScore, 68);
  assert.equal(dashboard.summary.grossIncomeWeek, 5_950);
  assert.equal(dashboard.summary.workCostsWeek, 1_100);
  assert.equal(dashboard.summary.trueNetIncomeWeek, 4_850);
});
