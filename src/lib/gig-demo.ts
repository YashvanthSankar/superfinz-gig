import { calculateGigDashboard, type CashEntryDto, type GigBundleDto, type GigDashboardDto } from "@superfinz/shared";

const iso = (date: Date) => date.toISOString();
const ago = (now: Date, days: number) => new Date(now.getTime() - days * 86_400_000);
const ahead = (now: Date, days: number) => new Date(now.getTime() + days * 86_400_000);

export function createGigDemo(now = new Date()): GigDashboardDto {
  const userId = "demo-ravi"; const created = ago(now, 120); const sourceRows = [
    { id: "source-swiggy", name: "Swiggy", type: "PLATFORM_PAYOUT" as const, frequency: "WEEKLY" as const, typicalMin: 2_100, typicalMax: 3_400, payoutDay: 5, nextPayoutAt: iso(ahead(now, 2)), connectionMode: "SIMULATED_PLATFORM" as const },
    { id: "source-rapido", name: "Rapido", type: "PLATFORM_PAYOUT" as const, frequency: "WEEKLY" as const, typicalMin: 900, typicalMax: 1_600, payoutDay: 1, nextPayoutAt: iso(ahead(now, 5)), connectionMode: "SIMULATED_PLATFORM" as const },
    { id: "source-upi", name: "Direct UPI tips", type: "DIRECT_UPI" as const, frequency: "IRREGULAR" as const, typicalMin: 150, typicalMax: 700, payoutDay: null, nextPayoutAt: null, connectionMode: "MANUAL" as const },
  ];
  const history: CashEntryDto[] = Array.from({ length: 11 }, (_, week) => [
    { id: `history-s-${week}`, userId, kind: "INCOME" as const, amount: 2_400 + (week % 4) * 260, sourceId: "source-swiggy", sourceName: "Swiggy", category: "Platform payout", paymentMethod: "PLATFORM", note: week === 5 ? "Paid one day late" : null, workRelated: false, status: week === 5 ? "SETTLED" as const : "SETTLED" as const, date: iso(ago(now, 7 * (week + 1))), createdAt: iso(ago(now, 7 * (week + 1))) },
    { id: `history-r-${week}`, userId, kind: "INCOME" as const, amount: 950 + (week % 3) * 180, sourceId: "source-rapido", sourceName: "Rapido", category: "Platform payout", paymentMethod: "PLATFORM", note: null, workRelated: false, status: "SETTLED" as const, date: iso(ago(now, 7 * (week + 1) + 2)), createdAt: iso(ago(now, 7 * (week + 1) + 2)) },
  ]).flat();
  const entries: CashEntryDto[] = [
    { id: "current-1", userId, kind: "INCOME", amount: 3_200, sourceId: "source-swiggy", sourceName: "Swiggy", category: "Platform payout", paymentMethod: "PLATFORM", note: null, workRelated: false, status: "SETTLED", payoutSplitId: "split-latest", date: iso(ago(now, 2)), createdAt: iso(ago(now, 2)) },
    { id: "current-2", userId, kind: "INCOME", amount: 2_000, sourceId: "source-rapido", sourceName: "Rapido", category: "Platform payout", paymentMethod: "PLATFORM", note: null, workRelated: false, status: "SETTLED", date: iso(ago(now, 1)), createdAt: iso(ago(now, 1)) },
    { id: "current-3", userId, kind: "INCOME", amount: 750, sourceId: "source-upi", sourceName: "Direct UPI tips", category: "Tips", paymentMethod: "UPI", note: null, workRelated: false, status: "SETTLED", date: iso(now), createdAt: iso(now) },
    { id: "cost-1", userId, kind: "WORK_EXPENSE", amount: 650, sourceId: null, sourceName: null, category: "Fuel", paymentMethod: "UPI", note: null, workRelated: true, status: "SETTLED", date: iso(ago(now, 2)), createdAt: iso(ago(now, 2)) },
    { id: "cost-2", userId, kind: "WORK_EXPENSE", amount: 450, sourceId: null, sourceName: null, category: "Maintenance", paymentMethod: "CASH", note: "Tyre repair", workRelated: true, status: "SETTLED", date: iso(ago(now, 1)), createdAt: iso(ago(now, 1)) },
    ...history,
  ];
  const bundle: GigBundleDto = {
    profile: { id: "profile-ravi", userId, preferredName: "Ravi", city: "Chennai", preferredLanguage: "English", workTypes: ["DELIVERY", "RIDE_HAILING"], primaryPriority: "STABLE_WEEKLY_SPENDING", lowWeekIncome: 3_100, typicalWeekIncome: 6_200, goodWeekIncome: 9_300, workDaysPerWeek: 6, platformDeductionRate: 10, weeklyWorkCosts: 1_200, openingBalance: 5_900, currentBalance: 6_800, safetyBuffer: 600, cushionTargetDays: 30, createdAt: iso(created), updatedAt: iso(now) },
    sources: sourceRows.map((source) => ({ ...source, userId, status: source.id === "source-upi" ? "PAUSED" as const : "ACTIVE" as const, prototype: true, consentAt: source.connectionMode === "MANUAL" ? null : iso(ago(now, 30)), consentExpiresAt: source.connectionMode === "MANUAL" ? null : iso(ahead(now, 60)), lastSyncAt: source.connectionMode === "MANUAL" ? null : iso(ago(now, .02)), createdAt: iso(created), updatedAt: iso(now) })),
    entries,
    commitments: [
      { id: "rent", userId, title: "Rent", category: "Rent", amount: 4_000, dueDate: iso(ahead(now, 5)), recurrence: "MONTHLY", essential: true, priority: 1, autopay: false, fundedAmount: 1_000, status: "DUE", createdAt: iso(created), updatedAt: iso(now) },
      { id: "mobile", userId, title: "Mobile bill", category: "Phone and data", amount: 299, dueDate: iso(ahead(now, 3)), recurrence: "MONTHLY", essential: true, priority: 2, autopay: true, fundedAmount: 299, status: "DUE", createdAt: iso(created), updatedAt: iso(now) },
      { id: "family", userId, title: "Family contribution", category: "Family", amount: 1_000, dueDate: iso(ahead(now, 8)), recurrence: "MONTHLY", essential: true, priority: 2, autopay: false, fundedAmount: 0, status: "DUE", createdAt: iso(created), updatedAt: iso(now) },
    ],
    pockets: [
      { id: "p-essential", userId, kind: "ESSENTIALS", currentAmount: 1_000, targetAmount: 5_299, updatedAt: iso(now) },
      { id: "p-work", userId, kind: "WORK_COSTS", currentAmount: 420, targetAmount: 1_200, updatedAt: iso(now) },
      { id: "p-cushion", userId, kind: "EMERGENCY_CUSHION", currentAmount: 4_200, targetAmount: 10_350, updatedAt: iso(now) },
      { id: "p-long", userId, kind: "LONG_TERM_SAVINGS", currentAmount: 560, targetAmount: 25_000, updatedAt: iso(now) },
      { id: "p-flex", userId, kind: "FLEXIBLE_SPENDING", currentAmount: 620, targetAmount: 930, updatedAt: iso(now) },
    ],
    splitRule: { id: "rule-ravi", userId, essentialsPct: 55, workCostsPct: 15, emergencyPct: 10, longTermPct: 5, flexiblePct: 15, enabled: true, updatedAt: iso(now) },
    payoutSplits: [{ id: "split-latest", userId, sourceId: "source-swiggy", sourceName: "Swiggy", amount: 3_200, receivedAt: iso(ago(now, 2)), essentialsAmount: 1_760, workCostsAmount: 480, emergencyAmount: 320, longTermAmount: 160, flexibleAmount: 480, note: null, createdAt: iso(ago(now, 2)) }],
  };
  return calculateGigDashboard(bundle, now);
}
