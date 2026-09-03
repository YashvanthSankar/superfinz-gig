import { z } from "zod";

export const GIG_WORK_TYPES = ["DELIVERY", "RIDE_HAILING", "HOME_SERVICES", "FREELANCE", "STREET_VENDING", "DAILY_WAGE", "DOMESTIC_WORK", "OTHER"] as const;
export const GIG_PRIORITIES = ["STABLE_WEEKLY_SPENDING", "EMERGENCY_CUSHION", "UPCOMING_BILLS", "WORK_EXPENSES", "AVOIDING_DEBT"] as const;
export const GIG_SOURCE_TYPES = ["PLATFORM_PAYOUT", "DIRECT_UPI", "BANK_TRANSFER", "CASH", "OTHER"] as const;
export const GIG_FREQUENCIES = ["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY", "IRREGULAR"] as const;
export const CONNECTION_MODES = ["SIMULATED_BANK", "SIMULATED_PLATFORM", "FILE_IMPORT", "MANUAL"] as const;
export const CASH_ENTRY_KINDS = ["INCOME", "WORK_EXPENSE", "ESSENTIAL_EXPENSE", "FLEXIBLE_EXPENSE", "COMMITMENT_PAYMENT", "POCKET_ALLOCATION", "TRANSFER"] as const;
export const COMMITMENT_RECURRENCES = ["WEEKLY", "FORTNIGHTLY", "MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"] as const;
export const POCKET_KINDS = ["ESSENTIALS", "WORK_COSTS", "EMERGENCY_CUSHION", "LONG_TERM_SAVINGS", "FLEXIBLE_SPENDING"] as const;

export type GigWorkType = typeof GIG_WORK_TYPES[number];
export type GigPriority = typeof GIG_PRIORITIES[number];
export type GigSourceType = typeof GIG_SOURCE_TYPES[number];
export type GigFrequency = typeof GIG_FREQUENCIES[number];
export type ConnectionMode = typeof CONNECTION_MODES[number];
export type CashEntryKind = typeof CASH_ENTRY_KINDS[number];
export type CommitmentRecurrence = typeof COMMITMENT_RECURRENCES[number];
export type PocketKind = typeof POCKET_KINDS[number];

export type GigProfileDto = {
  id: string;
  userId: string;
  preferredName: string;
  city: string;
  preferredLanguage: string;
  workTypes: GigWorkType[];
  primaryPriority: GigPriority;
  lowWeekIncome: number;
  typicalWeekIncome: number;
  goodWeekIncome: number;
  workDaysPerWeek: number;
  platformDeductionRate: number;
  weeklyWorkCosts: number;
  openingBalance: number;
  currentBalance: number;
  safetyBuffer: number;
  cushionTargetDays: number;
  createdAt: string;
  updatedAt: string;
};

export type GigIncomeSourceDto = {
  id: string;
  userId: string;
  name: string;
  type: GigSourceType;
  frequency: GigFrequency;
  typicalMin: number;
  typicalMax: number;
  payoutDay: number | null;
  nextPayoutAt: string | null;
  connectionMode: ConnectionMode;
  status: "ACTIVE" | "PAUSED" | "ERROR" | "REVOKED";
  prototype: boolean;
  consentAt: string | null;
  consentExpiresAt: string | null;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CashEntryDto = {
  id: string;
  userId: string;
  kind: CashEntryKind;
  amount: number;
  sourceId: string | null;
  sourceName: string | null;
  category: string;
  paymentMethod: string;
  note: string | null;
  workRelated: boolean;
  status: "SETTLED" | "EXPECTED" | "PLANNED" | "PAID";
  pocketDebit?: number | null;
  payoutSplitId?: string | null;
  commitmentId?: string | null;
  commitmentDueDate?: string | null;
  date: string;
  createdAt: string;
};

export type CommitmentDto = {
  id: string;
  userId: string;
  title: string;
  category: string;
  amount: number;
  dueDate: string;
  recurrence: CommitmentRecurrence;
  essential: boolean;
  priority: number;
  autopay: boolean;
  fundedAmount: number;
  status: "DUE" | "PAID" | "RESCHEDULED";
  createdAt: string;
  updatedAt: string;
};

export type PocketDto = {
  id: string;
  userId: string;
  kind: PocketKind;
  currentAmount: number;
  targetAmount: number;
  updatedAt: string;
};

export type SplitRuleDto = {
  id: string;
  userId: string;
  essentialsPct: number;
  workCostsPct: number;
  emergencyPct: number;
  longTermPct: number;
  flexiblePct: number;
  enabled: boolean;
  updatedAt: string;
};

export type PayoutSplitDto = {
  id: string;
  userId: string;
  sourceId: string | null;
  sourceName: string;
  amount: number;
  receivedAt: string;
  essentialsAmount: number;
  workCostsAmount: number;
  emergencyAmount: number;
  longTermAmount: number;
  flexibleAmount: number;
  note: string | null;
  createdAt: string;
};

export type GigBundleDto = {
  profile: GigProfileDto;
  sources: GigIncomeSourceDto[];
  entries: CashEntryDto[];
  commitments: CommitmentDto[];
  pockets: PocketDto[];
  splitRule: SplitRuleDto;
  payoutSplits: PayoutSplitDto[];
};

export type GigDashboardDto = GigBundleDto & {
  summary: {
    availableBalance: number;
    safeToSpend: number;
    safeUntil: string;
    protectedMoney: number;
    dueBeforeNextPayout: number;
    workCostsBeforeNextPayout: number;
    safetyBufferGap: number;
    expectedPayoutMin: number;
    expectedPayoutMax: number;
    grossIncomeWeek: number;
    workCostsWeek: number;
    trueNetIncomeWeek: number;
    typicalWeekDeltaPct: number;
    protectedDays: number;
    cushionTargetDays: number;
    resilienceScore: number;
    resilienceStatus: string;
    forecastIncomeLow30d: number;
    forecastIncomeHigh30d: number;
    committedOutflow30d: number;
    estimatedWorkCosts30d: number;
    forecastConfidence: "LOW" | "MEDIUM" | "HIGH";
  };
  timeline: Array<{ id: string; date: string; type: "INCOME" | "COMMITMENT" | "WORK_COST"; title: string; amountMin: number; amountMax: number; status: string }>;
  resilienceFactors: Array<{ key: string; label: string; score: number; evidence: string; action: string }>;
  recommendation: { title: string; body: string; action: string };
};

const money = z.number().nonnegative().max(100_000_000);
export const gigSourceInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(GIG_SOURCE_TYPES),
  frequency: z.enum(GIG_FREQUENCIES),
  typicalMin: money,
  typicalMax: money,
  payoutDay: z.number().int().min(0).max(6).nullable().optional(),
  nextPayoutAt: z.string().datetime().nullable().optional(),
  connectionMode: z.enum(CONNECTION_MODES),
  prototype: z.boolean().default(true),
}).refine((value) => value.typicalMax >= value.typicalMin, { message: "Maximum payout must be at least the minimum payout", path: ["typicalMax"] });

export const commitmentInputSchema = z.object({
  title: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(60),
  amount: money.refine((value) => value > 0, "Amount must be positive"),
  dueDate: z.string().datetime(),
  recurrence: z.enum(COMMITMENT_RECURRENCES),
  essential: z.boolean(),
  priority: z.number().int().min(1).max(5),
  autopay: z.boolean(),
});

const splitPercentagesSchema = z.object({
  essentialsPct: z.number().min(0).max(100),
  workCostsPct: z.number().min(0).max(100),
  emergencyPct: z.number().min(0).max(100),
  longTermPct: z.number().min(0).max(100),
  flexiblePct: z.number().min(0).max(100),
});
export const splitRuleInputSchema = splitPercentagesSchema.extend({
  enabled: z.boolean().default(false),
}).refine((value) => Math.abs(value.essentialsPct + value.workCostsPct + value.emergencyPct + value.longTermPct + value.flexiblePct - 100) < .001, { message: "Smart Split percentages must total 100" });

export const gigOnboardingSchema = z.object({
  preferredName: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(80),
  preferredLanguage: z.string().trim().min(2).max(40),
  workTypes: z.array(z.enum(GIG_WORK_TYPES)).min(1).max(GIG_WORK_TYPES.length),
  primaryPriority: z.enum(GIG_PRIORITIES),
  lowWeekIncome: money,
  typicalWeekIncome: money,
  goodWeekIncome: money,
  workDaysPerWeek: z.number().int().min(1).max(7),
  platformDeductionRate: z.number().min(0).max(80),
  weeklyWorkCosts: money,
  openingBalance: money,
  currentCushion: money,
  safetyBuffer: money,
  cushionTargetDays: z.number().int().min(7).max(180),
  sources: z.array(gigSourceInputSchema).min(1).max(20),
  commitments: z.array(commitmentInputSchema).max(50),
  splitRule: splitRuleInputSchema,
}).refine((value) => value.lowWeekIncome <= value.typicalWeekIncome && value.typicalWeekIncome <= value.goodWeekIncome, { message: "Weekly income must increase from low to typical to good", path: ["typicalWeekIncome"] });

export const cashEntryInputSchema = z.object({
  kind: z.enum(CASH_ENTRY_KINDS),
  amount: money.refine((value) => value > 0, "Amount must be positive"),
  sourceId: z.string().nullable().optional(),
  sourceName: z.string().trim().max(80).nullable().optional(),
  category: z.string().trim().min(1).max(60),
  paymentMethod: z.string().trim().min(1).max(40),
  note: z.string().trim().max(300).nullable().optional(),
  workRelated: z.boolean().default(false),
  status: z.enum(["SETTLED", "EXPECTED", "PLANNED", "PAID"]).default("SETTLED"),
  date: z.string().datetime(),
});

export const payoutSplitInputSchema = z.object({
  sourceId: z.string().nullable().optional(),
  sourceName: z.string().trim().min(1).max(80),
  amount: money.refine((value) => value > 0, "Amount must be positive"),
  receivedAt: z.string().datetime(),
  note: z.string().trim().max(300).nullable().optional(),
  percentages: splitPercentagesSchema.refine((value) => Math.abs(value.essentialsPct + value.workCostsPct + value.emergencyPct + value.longTermPct + value.flexiblePct - 100) < .001, { message: "Smart Split percentages must total 100" }),
});

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const daysBetween = (from: Date, to: Date) => Math.max(1, Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000));
const recurrenceMonthly = (commitment: CommitmentDto, now: Date) => {
  if (commitment.status === "PAID" && commitment.recurrence === "ONE_TIME") return 0;
  if (commitment.recurrence === "WEEKLY") return commitment.amount * 4.345;
  if (commitment.recurrence === "FORTNIGHTLY") return commitment.amount * 2.1725;
  if (commitment.recurrence === "MONTHLY") return commitment.amount;
  if (commitment.recurrence === "QUARTERLY") return commitment.amount / 3;
  if (commitment.recurrence === "YEARLY") return commitment.amount / 12;
  return new Date(commitment.dueDate).getTime() <= now.getTime() + 30 * 86_400_000 ? commitment.amount : 0;
};

export function calculateGigDashboard(bundle: GigBundleDto, nowInput: Date | string = new Date()): GigDashboardDto {
  const now = new Date(nowInput); const activeSources = bundle.sources.filter((source) => source.status === "ACTIVE"); const nextSource = [...activeSources].filter((source) => source.nextPayoutAt && new Date(source.nextPayoutAt) >= now).sort((a, b) => new Date(a.nextPayoutAt!).getTime() - new Date(b.nextPayoutAt!).getTime())[0]; const nextPayout = nextSource?.nextPayoutAt ? new Date(nextSource.nextPayoutAt) : new Date(now.getTime() + 7 * 86_400_000); const daysToPayout = daysBetween(now, nextPayout);
  const pockets = new Map(bundle.pockets.map((pocket) => [pocket.kind, pocket])); const pocketAmount = (kind: PocketKind) => pockets.get(kind)?.currentAmount ?? 0;
  const dueCommitments = bundle.commitments.filter((commitment) => commitment.status !== "PAID" && new Date(commitment.dueDate) <= nextPayout); const dueBeforeNextPayout = dueCommitments.reduce((sum, commitment) => sum + Math.max(0, commitment.amount - commitment.fundedAmount), 0); const expectedWorkCosts = bundle.profile.weeklyWorkCosts / Math.max(1, bundle.profile.workDaysPerWeek) * Math.min(bundle.profile.workDaysPerWeek, daysToPayout); const unfundedCommitments = Math.max(0, dueBeforeNextPayout - pocketAmount("ESSENTIALS")); const unfundedWorkCosts = Math.max(0, expectedWorkCosts - pocketAmount("WORK_COSTS")); const safetyBufferGap = Math.max(0, bundle.profile.safetyBuffer - pocketAmount("EMERGENCY_CUSHION")); const protectedPocketMoney = pocketAmount("ESSENTIALS") + pocketAmount("WORK_COSTS") + pocketAmount("EMERGENCY_CUSHION") + pocketAmount("LONG_TERM_SAVINGS"); const protectedMoney = Math.min(bundle.profile.currentBalance, protectedPocketMoney + unfundedCommitments + unfundedWorkCosts + safetyBufferGap); const safeToSpend = Math.max(0, bundle.profile.currentBalance - protectedMoney);
  const weekStart = new Date(now.getTime() - 6 * 86_400_000); const weekEntries = bundle.entries.filter((entry) => new Date(entry.date) >= weekStart && new Date(entry.date) <= now && ["SETTLED", "PAID"].includes(entry.status)); const grossIncomeWeek = weekEntries.filter((entry) => entry.kind === "INCOME").reduce((sum, entry) => sum + entry.amount, 0); const workCostsWeek = weekEntries.filter((entry) => entry.kind === "WORK_EXPENSE").reduce((sum, entry) => sum + entry.amount, 0); const trueNetIncomeWeek = grossIncomeWeek - workCostsWeek; const typicalWeekDeltaPct = bundle.profile.typicalWeekIncome > 0 ? (trueNetIncomeWeek - bundle.profile.typicalWeekIncome) / bundle.profile.typicalWeekIncome * 100 : 0;
  const monthlyEssential = bundle.commitments.filter((commitment) => commitment.essential).reduce((sum, commitment) => sum + recurrenceMonthly(commitment, now), 0); const dailyEssential = Math.max(1, monthlyEssential / 30.44 + bundle.profile.weeklyWorkCosts / 7); const protectedDays = pocketAmount("EMERGENCY_CUSHION") / dailyEssential;
  const incomeSpread = bundle.profile.typicalWeekIncome > 0 ? (bundle.profile.goodWeekIncome - bundle.profile.lowWeekIncome) / (2 * bundle.profile.typicalWeekIncome) : 1; const consistency = clamp((1 - incomeSpread) * 100); const diversity = clamp(activeSources.length / 3 * 100); const coverage = protectedMoney > 0 ? clamp(bundle.profile.currentBalance / protectedMoney * 100) : 100; const cushion = clamp(protectedDays / bundle.profile.cushionTargetDays * 100); const workCostControl = bundle.profile.typicalWeekIncome > 0 ? clamp((1 - bundle.profile.weeklyWorkCosts / bundle.profile.typicalWeekIncome) * 100) : 0; const resilienceScore = Math.round(consistency * .25 + diversity * .15 + coverage * .25 + cushion * .2 + workCostControl * .15); const resilienceStatus = resilienceScore >= 75 ? "Protected" : resilienceScore >= 50 ? "Building stability" : "Needs attention";
  const factors = [
    { key: "consistency", label: "Income consistency", score: Math.round(consistency), evidence: `Your low-to-good week range is ₹${Math.round(bundle.profile.lowWeekIncome).toLocaleString("en-IN")}–₹${Math.round(bundle.profile.goodWeekIncome).toLocaleString("en-IN")}.`, action: "Keep income ranges current after unusual weeks." },
    { key: "diversity", label: "Income-source diversity", score: Math.round(diversity), evidence: `${activeSources.length} active income source${activeSources.length === 1 ? "" : "s"}.`, action: activeSources.length < 2 ? "Add a second reliable earning source when practical." : "Keep source payout details current." },
    { key: "coverage", label: "Commitment coverage", score: Math.round(coverage), evidence: `₹${Math.round(protectedMoney).toLocaleString("en-IN")} is protected from a ₹${Math.round(bundle.profile.currentBalance).toLocaleString("en-IN")} balance.`, action: safeToSpend === 0 ? "Protect the next essential commitment before flexible spending." : "Review commitments whenever due dates change." },
    { key: "cushion", label: "Emergency-cushion depth", score: Math.round(cushion), evidence: `${Math.floor(protectedDays)} protected days toward a ${bundle.profile.cushionTargetDays}-day goal.`, action: `Direct part of the next settled payout to the cushion.` },
    { key: "work-costs", label: "Work-cost control", score: Math.round(workCostControl), evidence: `Typical weekly work costs are ₹${Math.round(bundle.profile.weeklyWorkCosts).toLocaleString("en-IN")}.`, action: "Track fuel, platform fees, and maintenance separately." },
  ];
  const recommendation = safeToSpend === 0 ? { title: "Protect the next payout", body: `Your current balance is fully needed for commitments, work costs, or the safety buffer until ${nextPayout.toLocaleDateString("en-IN", { weekday: "long" })}.`, action: "Review alternatives" } : protectedDays < bundle.profile.cushionTargetDays ? { title: "Add one protected day", body: `Protect about ₹${Math.ceil(dailyEssential).toLocaleString("en-IN")} from the next settled payout to grow your cushion.`, action: "Plan contribution" } : { title: "Your plan is stable today", body: `You can use up to ₹${Math.floor(safeToSpend).toLocaleString("en-IN")} before the next expected payout while keeping the current plan protected.`, action: "View calculation" };
  const commitmentEvents = bundle.commitments.filter((item) => item.status !== "PAID").map((item) => ({ id: `commitment-${item.id}`, date: item.dueDate, type: "COMMITMENT" as const, title: item.title, amountMin: item.amount, amountMax: item.amount, status: item.status })); const payoutEvents = activeSources.filter((item) => item.nextPayoutAt).map((item) => ({ id: `source-${item.id}`, date: item.nextPayoutAt!, type: "INCOME" as const, title: `${item.name} payout`, amountMin: item.typicalMin, amountMax: item.typicalMax, status: "EXPECTED" })); const timeline = [...commitmentEvents, ...payoutEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 7);
  const committedOutflow30d = bundle.commitments.reduce((sum, commitment) => sum + recurrenceMonthly(commitment, now), 0); const sourceHistoryWeeks = Math.max(0, bundle.entries.filter((entry) => entry.kind === "INCOME").length / Math.max(1, activeSources.length)); const forecastConfidence = sourceHistoryWeeks >= 8 ? "HIGH" : sourceHistoryWeeks >= 3 ? "MEDIUM" : "LOW";
  return { ...bundle, summary: { availableBalance: bundle.profile.currentBalance, safeToSpend, safeUntil: nextPayout.toISOString(), protectedMoney, dueBeforeNextPayout, workCostsBeforeNextPayout: expectedWorkCosts, safetyBufferGap, expectedPayoutMin: nextSource?.typicalMin ?? bundle.profile.lowWeekIncome, expectedPayoutMax: nextSource?.typicalMax ?? bundle.profile.goodWeekIncome, grossIncomeWeek, workCostsWeek, trueNetIncomeWeek, typicalWeekDeltaPct, protectedDays, cushionTargetDays: bundle.profile.cushionTargetDays, resilienceScore, resilienceStatus, forecastIncomeLow30d: bundle.profile.lowWeekIncome * 4.345, forecastIncomeHigh30d: bundle.profile.goodWeekIncome * 4.345, committedOutflow30d, estimatedWorkCosts30d: bundle.profile.weeklyWorkCosts * 4.345, forecastConfidence }, timeline, resilienceFactors: factors, recommendation };
}
