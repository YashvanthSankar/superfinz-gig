import { z } from "zod";

export const GIG_WORK_TYPES = [
  "DELIVERY",
  "RIDE_HAILING",
  "HOME_SERVICES",
  "FREELANCE",
  "STREET_VENDING",
  "DAILY_WAGE",
  "DOMESTIC_WORK",
  "OTHER",
] as const;
export const GIG_PRIORITIES = [
  "STABLE_WEEKLY_SPENDING",
  "EMERGENCY_CUSHION",
  "UPCOMING_BILLS",
  "WORK_EXPENSES",
  "AVOIDING_DEBT",
] as const;
export const GIG_SOURCE_TYPES = [
  "PLATFORM_PAYOUT",
  "DIRECT_UPI",
  "BANK_TRANSFER",
  "CASH",
  "OTHER",
] as const;
export const GIG_FREQUENCIES = [
  "DAILY",
  "WEEKLY",
  "FORTNIGHTLY",
  "MONTHLY",
  "IRREGULAR",
] as const;
export const CONNECTION_MODES = [
  "SIMULATED_BANK",
  "SIMULATED_PLATFORM",
  "FILE_IMPORT",
  "MANUAL",
] as const;
export const CASH_ENTRY_KINDS = [
  "INCOME",
  "WORK_EXPENSE",
  "ESSENTIAL_EXPENSE",
  "FLEXIBLE_EXPENSE",
  "COMMITMENT_PAYMENT",
  "POCKET_ALLOCATION",
  "TRANSFER",
] as const;
export const COMMITMENT_RECURRENCES = [
  "WEEKLY",
  "FORTNIGHTLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
  "ONE_TIME",
] as const;
export const POCKET_KINDS = [
  "ESSENTIALS",
  "WORK_COSTS",
  "EMERGENCY_CUSHION",
  "LONG_TERM_SAVINGS",
  "FLEXIBLE_SPENDING",
] as const;

export type GigWorkType = (typeof GIG_WORK_TYPES)[number];
export type GigPriority = (typeof GIG_PRIORITIES)[number];
export type GigSourceType = (typeof GIG_SOURCE_TYPES)[number];
export type GigFrequency = (typeof GIG_FREQUENCIES)[number];

/**
 * Advances an income source only when a received payout reaches or passes the
 * source's currently scheduled date. An early or partial payout must not push
 * an already-future schedule forward again.
 */
export function nextExpectedPayoutAt(
  frequency: string,
  currentNextPayoutAt: number | null | undefined,
  receivedAt: number,
): number | null {
  if (!["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY"].includes(frequency))
    return null;
  if (
    currentNextPayoutAt !== null &&
    currentNextPayoutAt !== undefined &&
    currentNextPayoutAt > receivedAt
  )
    return currentNextPayoutAt;

  const next = new Date(currentNextPayoutAt ?? receivedAt);
  const anchorDay = next.getUTCDate();
  const advance = () => {
    if (frequency === "DAILY") next.setUTCDate(next.getUTCDate() + 1);
    else if (frequency === "WEEKLY") next.setUTCDate(next.getUTCDate() + 7);
    else if (frequency === "FORTNIGHTLY")
      next.setUTCDate(next.getUTCDate() + 14);
    else {
      next.setUTCDate(1);
      next.setUTCMonth(next.getUTCMonth() + 1);
      const lastDay = new Date(
        Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
      ).getUTCDate();
      next.setUTCDate(Math.min(anchorDay, lastDay));
    }
  };
  do advance();
  while (next.getTime() <= receivedAt);
  return next.getTime();
}
export type ConnectionMode = (typeof CONNECTION_MODES)[number];
export type CashEntryKind = (typeof CASH_ENTRY_KINDS)[number];
export type CommitmentRecurrence = (typeof COMMITMENT_RECURRENCES)[number];
export type PocketKind = (typeof POCKET_KINDS)[number];

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
  dataTypes?: string[];
  purpose?: string | null;
  consentReceiptId?: string | null;
  consentFrom?: string | null;
  consentTo?: string | null;
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
  recurring?: boolean;
  date: string;
  createdAt: string;
  updatedAt?: string;
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
  allocationMode?: "ADAPTIVE" | "CUSTOM";
  beforeSafeAmount?: number | null;
  afterSafeAmount?: number | null;
  beforeProtectedDays?: number | null;
  afterProtectedDays?: number | null;
  fundedCommitmentIds?: string[];
  fundedCommitments?: Array<{ id: string; amount: number }>;
  recommendationReason?: string | null;
  createdAt: string;
};

export type SplitPercentages = {
  essentialsPct: number;
  workCostsPct: number;
  emergencyPct: number;
  longTermPct: number;
  flexiblePct: number;
};

export type AdaptiveSplitRecommendation = {
  percentages: SplitPercentages;
  amounts: {
    essentials: number;
    workCosts: number;
    emergency: number;
    longTerm: number;
    flexible: number;
  };
  beforeSafeAmount: number;
  afterSafeAmount: number;
  beforeProtectedDays: number;
  afterProtectedDays: number;
  fundedCommitments: Array<{ id: string; title: string; amount: number }>;
  reasons: string[];
};

export type GigScenarioInput = {
  incomeChangePct: number;
  payoutDelayDays: number;
  surpriseCost: number;
  workDaysOff: number;
  workCostChangePct: number;
};

export type GigScenarioResult = {
  safeToSpend: number;
  forecastIncomeLow30d: number;
  forecastIncomeHigh30d: number;
  lowestProjectedBalance: number;
  protectedDays: number;
  earningTarget: number;
  targetPerRemainingWorkday: number;
  atRiskCommitments: Array<{
    id: string;
    title: string;
    amount: number;
    dueDate: string;
  }>;
  recommendedAction: string;
  nonCreditAlternatives: string[];
};

export type GigInsightsDto = {
  outlook: {
    lowestBalanceLow: number;
    lowestBalanceHigh: number;
    safetyFloor: number;
    gapToSafetyFloor: number;
    status: "ON_TRACK" | "WATCH" | "AT_RISK";
    title: string;
    body: string;
  };
  earnings: {
    basis: "ACTUAL_WEEK" | "TYPICAL_WEEK";
    gross: number;
    workCosts: number;
    net: number;
    workCostPerHundred: number;
    keptPerHundred: number;
    changeFromTypicalPct: number;
  };
  month: {
    forecastIncomeLow: number;
    forecastIncomeHigh: number;
    committedOutflow: number;
    estimatedWorkCosts: number;
    confidence: "LOW" | "MEDIUM" | "HIGH";
  };
};

export const GIG_ALERT_CATEGORIES = [
  "PAYOUTS",
  "COMMITMENTS",
  "SAFETY",
  "INCOME",
  "WORK_COSTS",
  "CONNECTIONS",
  "RESILIENCE",
  "BENEFITS",
] as const;
export type GigAlertCategory = (typeof GIG_ALERT_CATEGORIES)[number];

export type GigPreferencesDto = {
  userId: string;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  alertCategories: GigAlertCategory[];
  quietHoursStart: string;
  quietHoursEnd: string;
  reminderDaysBefore: number;
  largerText: boolean;
  higherContrast: boolean;
  reducedMotion: boolean;
  updatedAt: string;
};

export type GigNotificationStateDto = {
  key: string;
  readAt: string | null;
  dismissedAt: string | null;
  snoozedUntil: string | null;
};

export type GigNotificationDto = {
  id: string;
  category: GigAlertCategory;
  severity: "INFO" | "ACTION" | "WARNING";
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
  createdAt: string;
  read: boolean;
};

export type GigPartnerMetricsDto = {
  range: { from: string; to: string };
  filters: { cities: string[]; workTypes: string[] };
  metrics: {
    activeWorkers: number;
    weeklyActiveUsers: number;
    connectedIncomeSources: number;
    commitmentCoveragePct: number;
    averageProtectedDays: number;
    predictedShortfalls: number;
    shortfallsResolvedWithoutCredit: number;
    creditAvoided: number;
    workCostRatioPct: number;
    consentCoveragePct: number;
    payoutsAllocated: number;
    payoutValue: number;
    safeChecksPerWorker: number;
    forecastAccuracyPct: number | null;
    recommendedActionsCompleted: number;
    dataFreshnessAt: string;
  };
  trends: Array<{
    week: string;
    grossIncome: number;
    trueNetIncome: number;
    workCosts: number;
    payoutsAllocated: number;
  }>;
  policy: {
    aggregationOnly: boolean;
    minimumCohortSize: number;
    workerLevelSurveillance: boolean;
    punitiveScoring: boolean;
    creditPromotionNotifications: boolean;
  };
};

export const DEFAULT_GIG_PREFERENCES: Omit<
  GigPreferencesDto,
  "userId" | "updatedAt"
> = {
  inAppEnabled: true,
  pushEnabled: false,
  smsEnabled: false,
  whatsappEnabled: false,
  alertCategories: [...GIG_ALERT_CATEGORIES],
  quietHoursStart: "21:00",
  quietHoursEnd: "07:00",
  reminderDaysBefore: 3,
  largerText: false,
  higherContrast: false,
  reducedMotion: false,
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
    allCostsWeek: number;
    cashChangeWeek: number;
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
    todayGrossIncome: number;
    activeSourceCount: number;
    payoutStatus: "UPCOMING" | "OVERDUE" | "UNSCHEDULED" | "NO_ACTIVE_SOURCE";
    nextPayoutAt: string | null;
    dataFreshnessAt: string;
    workCostRatioPct: number;
    lowestProjectedBalanceLow: number;
    lowestProjectedBalanceHigh: number;
  };
  timeline: Array<{
    id: string;
    date: string;
    type: "INCOME" | "COMMITMENT" | "WORK_COST";
    title: string;
    amountMin: number;
    amountMax: number;
    status: string;
  }>;
  forecast: Array<{
    date: string;
    actual: number | null;
    conservative: number | null;
    typical: number | null;
    optimistic: number | null;
    safetyFloor: number;
  }>;
  resilienceFactors: Array<{
    key: string;
    label: string;
    score: number;
    evidence: string;
    action: string;
  }>;
  recommendation: { title: string; body: string; action: string };
};

const money = z.number().nonnegative().max(100_000_000);
export const gigSourceInputSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    type: z.enum(GIG_SOURCE_TYPES),
    frequency: z.enum(GIG_FREQUENCIES),
    typicalMin: money,
    typicalMax: money,
    payoutDay: z.number().int().min(0).max(6).nullable().optional(),
    nextPayoutAt: z.string().datetime().nullable().optional(),
    connectionMode: z.enum(CONNECTION_MODES),
    prototype: z.boolean().default(true),
    dataTypes: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
    purpose: z.string().trim().max(240).nullable().optional(),
    consentFrom: z.string().datetime().nullable().optional(),
    consentTo: z.string().datetime().nullable().optional(),
  })
  .refine((value) => value.typicalMax >= value.typicalMin, {
    message: "Maximum payout must be at least the minimum payout",
    path: ["typicalMax"],
  });

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
export const splitRuleInputSchema = splitPercentagesSchema
  .extend({
    enabled: z.boolean().default(false),
  })
  .refine(
    (value) =>
      Math.abs(
        value.essentialsPct +
          value.workCostsPct +
          value.emergencyPct +
          value.longTermPct +
          value.flexiblePct -
          100,
      ) < 0.001,
    { message: "Smart Split percentages must total 100" },
  );

export const gigOnboardingSchema = z
  .object({
    preferredName: z.string().trim().min(1).max(80),
    city: z.string().trim().min(1).max(80),
    preferredLanguage: z.string().trim().min(2).max(40),
    workTypes: z
      .array(z.enum(GIG_WORK_TYPES))
      .min(1)
      .max(GIG_WORK_TYPES.length),
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
  })
  .refine(
    (value) =>
      value.lowWeekIncome <= value.typicalWeekIncome &&
      value.typicalWeekIncome <= value.goodWeekIncome,
    {
      message: "Weekly income must increase from low to typical to good",
      path: ["typicalWeekIncome"],
    },
  );

export const cashEntryInputSchema = z
  .object({
    kind: z.enum(CASH_ENTRY_KINDS),
    amount: money.refine((value) => value > 0, "Amount must be positive"),
    sourceId: z.string().nullable().optional(),
    sourceName: z.string().trim().max(80).nullable().optional(),
    category: z.string().trim().min(1).max(60),
    paymentMethod: z.string().trim().min(1).max(40),
    note: z.string().trim().max(300).nullable().optional(),
    workRelated: z.boolean().default(false),
    recurring: z.boolean().default(false),
    status: z
      .enum(["SETTLED", "EXPECTED", "PLANNED", "PAID"])
      .default("SETTLED"),
    date: z.string().datetime(),
  })
  .refine(
    (value) =>
      !["SETTLED", "PAID"].includes(value.status) ||
      new Date(value.date).getTime() <= Date.now() + 60_000,
    {
      message: "Settled money and costs cannot use a future date",
      path: ["date"],
    },
  );

export const gigPreferencesInputSchema = z.object({
  inAppEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
  alertCategories: z
    .array(z.enum(GIG_ALERT_CATEGORIES))
    .max(GIG_ALERT_CATEGORIES.length),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  reminderDaysBefore: z.number().int().min(0).max(30),
  largerText: z.boolean(),
  higherContrast: z.boolean(),
  reducedMotion: z.boolean(),
});

export const gigNotificationActionSchema = z
  .object({
    key: z.string().trim().min(1).max(160),
    action: z.enum(["READ", "UNREAD", "DISMISS", "SNOOZE"]),
    snoozedUntil: z.string().datetime().optional(),
  })
  .refine((value) => value.action !== "SNOOZE" || Boolean(value.snoozedUntil), {
    message: "Choose when to remind you",
    path: ["snoozedUntil"],
  });

export const payoutSplitInputSchema = z
  .object({
    sourceId: z.string().nullable().optional(),
    sourceName: z.string().trim().min(1).max(80),
    amount: money.refine((value) => value > 0, "Amount must be positive"),
    receivedAt: z.string().datetime(),
    note: z.string().trim().max(300).nullable().optional(),
    allocationMode: z.enum(["ADAPTIVE", "CUSTOM"]).default("ADAPTIVE"),
    percentages: splitPercentagesSchema.refine(
      (value) =>
        Math.abs(
          value.essentialsPct +
            value.workCostsPct +
            value.emergencyPct +
            value.longTermPct +
            value.flexiblePct -
            100,
        ) < 0.001,
      { message: "Smart Split percentages must total 100" },
    ),
  })
  .refine(
    (value) => new Date(value.receivedAt).getTime() <= Date.now() + 60_000,
    {
      message: "Record a payout only after the money reaches you",
      path: ["receivedAt"],
    },
  );

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
const daysBetween = (from: Date, to: Date) =>
  Math.max(
    1,
    Math.ceil(
      (startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000,
    ),
  );
const recurrenceMonthly = (commitment: CommitmentDto, now: Date) => {
  if (commitment.status === "PAID" && commitment.recurrence === "ONE_TIME")
    return 0;
  if (commitment.recurrence === "WEEKLY") return commitment.amount * 4.345;
  if (commitment.recurrence === "FORTNIGHTLY")
    return commitment.amount * 2.1725;
  if (commitment.recurrence === "MONTHLY") return commitment.amount;
  if (commitment.recurrence === "QUARTERLY") return commitment.amount / 3;
  if (commitment.recurrence === "YEARLY") return commitment.amount / 12;
  return new Date(commitment.dueDate).getTime() <=
    now.getTime() + 30 * 86_400_000
    ? commitment.amount
    : 0;
};

export function calculateGigDashboard(
  bundle: GigBundleDto,
  nowInput: Date | string = new Date(),
): GigDashboardDto {
  const now = new Date(nowInput);
  const activeSources = bundle.sources.filter(
    (source) => source.status === "ACTIVE",
  );
  const nextSource = [...activeSources]
    .filter((source) => source.nextPayoutAt)
    .sort(
      (a, b) =>
        new Date(a.nextPayoutAt!).getTime() -
        new Date(b.nextPayoutAt!).getTime(),
    )[0];
  const nextPayoutAt = nextSource?.nextPayoutAt
    ? new Date(nextSource.nextPayoutAt)
    : null;
  const payoutStatus = !activeSources.length
    ? "NO_ACTIVE_SOURCE"
    : !nextPayoutAt
      ? "UNSCHEDULED"
      : nextPayoutAt < now
        ? "OVERDUE"
        : "UPCOMING";
  const planningHorizon =
    payoutStatus === "UPCOMING" && nextPayoutAt
      ? nextPayoutAt
      : new Date(now.getTime() + 7 * 86_400_000);
  const daysToPayout = daysBetween(now, planningHorizon);
  const pockets = new Map(
    bundle.pockets.map((pocket) => [pocket.kind, pocket]),
  );
  const pocketAmount = (kind: PocketKind) =>
    pockets.get(kind)?.currentAmount ?? 0;
  const dueCommitments = bundle.commitments.filter(
    (commitment) =>
      commitment.essential &&
      commitment.status !== "PAID" &&
      new Date(commitment.dueDate) <= planningHorizon,
  );
  const dueBeforeNextPayout = dueCommitments.reduce(
    (sum, commitment) =>
      sum + Math.max(0, commitment.amount - commitment.fundedAmount),
    0,
  );
  const assignedEssentialMoney = dueCommitments.reduce(
    (sum, commitment) =>
      sum + Math.min(commitment.amount, commitment.fundedAmount),
    0,
  );
  const unassignedEssentialMoney = Math.max(
    0,
    pocketAmount("ESSENTIALS") - assignedEssentialMoney,
  );
  const fullWorkWeeks = Math.floor(daysToPayout / 7);
  const partialWeekWorkDays = Math.min(
    bundle.profile.workDaysPerWeek,
    daysToPayout % 7,
  );
  const expectedWorkCosts =
    bundle.profile.weeklyWorkCosts * fullWorkWeeks +
    (bundle.profile.weeklyWorkCosts /
      Math.max(1, bundle.profile.workDaysPerWeek)) *
      partialWeekWorkDays;
  const unfundedCommitments = Math.max(
    0,
    dueBeforeNextPayout - unassignedEssentialMoney,
  );
  const unfundedWorkCosts = Math.max(
    0,
    expectedWorkCosts - pocketAmount("WORK_COSTS"),
  );
  const safetyBufferGap = Math.max(
    0,
    bundle.profile.safetyBuffer - pocketAmount("EMERGENCY_CUSHION"),
  );
  const protectedPocketMoney =
    pocketAmount("ESSENTIALS") +
    pocketAmount("WORK_COSTS") +
    pocketAmount("EMERGENCY_CUSHION") +
    pocketAmount("LONG_TERM_SAVINGS");
  const protectedMoney = Math.min(
    bundle.profile.currentBalance,
    protectedPocketMoney +
      unfundedCommitments +
      unfundedWorkCosts +
      safetyBufferGap,
  );
  const safeToSpend = Math.max(
    0,
    bundle.profile.currentBalance - protectedMoney,
  );
  const weekStart = new Date(now.getTime() - 6 * 86_400_000);
  const weekEntries = bundle.entries.filter(
    (entry) =>
      new Date(entry.date) >= weekStart &&
      new Date(entry.date) <= now &&
      ["SETTLED", "PAID"].includes(entry.status),
  );
  const grossIncomeWeek = weekEntries
    .filter((entry) => entry.kind === "INCOME")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const workCostsWeek = weekEntries
    .filter((entry) => entry.kind === "WORK_EXPENSE")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const allCostsWeek = weekEntries
    .filter((entry) =>
      [
        "WORK_EXPENSE",
        "ESSENTIAL_EXPENSE",
        "FLEXIBLE_EXPENSE",
        "COMMITMENT_PAYMENT",
      ].includes(entry.kind),
    )
    .reduce((sum, entry) => sum + entry.amount, 0);
  const cashChangeWeek = grossIncomeWeek - allCostsWeek;
  const trueNetIncomeWeek = grossIncomeWeek - workCostsWeek;
  const typicalWeekDeltaPct =
    bundle.profile.typicalWeekIncome > 0
      ? ((trueNetIncomeWeek - bundle.profile.typicalWeekIncome) /
          bundle.profile.typicalWeekIncome) *
        100
      : 0;
  const todayStart = startOfDay(now);
  const todayGrossIncome = weekEntries
    .filter(
      (entry) => entry.kind === "INCOME" && new Date(entry.date) >= todayStart,
    )
    .reduce((sum, entry) => sum + entry.amount, 0);
  const monthlyEssential = bundle.commitments
    .filter((commitment) => commitment.essential)
    .reduce((sum, commitment) => sum + recurrenceMonthly(commitment, now), 0);
  const dailyEssential = Math.max(
    1,
    monthlyEssential / 30.44 + bundle.profile.weeklyWorkCosts / 7,
  );
  const protectedDays = pocketAmount("EMERGENCY_CUSHION") / dailyEssential;
  const incomeSpread =
    bundle.profile.typicalWeekIncome > 0
      ? (bundle.profile.goodWeekIncome - bundle.profile.lowWeekIncome) /
        (2 * bundle.profile.typicalWeekIncome)
      : 1;
  const consistency = clamp((1 - incomeSpread) * 100);
  const diversity = clamp((activeSources.length / 3) * 100);
  const coverage =
    protectedMoney > 0
      ? clamp((bundle.profile.currentBalance / protectedMoney) * 100)
      : 100;
  const cushion = clamp(
    (protectedDays / bundle.profile.cushionTargetDays) * 100,
  );
  const workCostControl =
    bundle.profile.typicalWeekIncome > 0
      ? clamp(
          (1 -
            bundle.profile.weeklyWorkCosts / bundle.profile.typicalWeekIncome) *
            100,
        )
      : 0;
  const resilienceScore = Math.round(
    consistency * 0.25 +
      diversity * 0.15 +
      coverage * 0.25 +
      cushion * 0.2 +
      workCostControl * 0.15,
  );
  const resilienceStatus =
    resilienceScore >= 75
      ? "Protected"
      : resilienceScore >= 50
        ? "Building stability"
        : "Needs attention";
  const factors = [
    {
      key: "consistency",
      label: "Income consistency",
      score: Math.round(consistency),
      evidence: `Your low-to-good week range is ₹${Math.round(bundle.profile.lowWeekIncome).toLocaleString("en-IN")}–₹${Math.round(bundle.profile.goodWeekIncome).toLocaleString("en-IN")}.`,
      action: "Keep income ranges current after unusual weeks.",
    },
    {
      key: "diversity",
      label: "Income-source diversity",
      score: Math.round(diversity),
      evidence: `${activeSources.length} active income source${activeSources.length === 1 ? "" : "s"}.`,
      action:
        activeSources.length < 2
          ? "Add a second reliable earning source when practical."
          : "Keep source payout details current.",
    },
    {
      key: "coverage",
      label: "Commitment coverage",
      score: Math.round(coverage),
      evidence: `₹${Math.round(protectedMoney).toLocaleString("en-IN")} is protected from a ₹${Math.round(bundle.profile.currentBalance).toLocaleString("en-IN")} balance.`,
      action:
        safeToSpend === 0
          ? "Protect the next essential commitment before flexible spending."
          : "Review commitments whenever due dates change.",
    },
    {
      key: "cushion",
      label: "Emergency-cushion depth",
      score: Math.round(cushion),
      evidence: `${Math.floor(protectedDays)} protected ${Math.floor(protectedDays) === 1 ? "day" : "days"} toward a ${bundle.profile.cushionTargetDays}-day goal.`,
      action: `Direct part of the next settled payout to the cushion.`,
    },
    {
      key: "work-costs",
      label: "Work-cost control",
      score: Math.round(workCostControl),
      evidence: `Typical weekly work costs are ₹${Math.round(bundle.profile.weeklyWorkCosts).toLocaleString("en-IN")}.`,
      action: "Track fuel, platform fees, and maintenance separately.",
    },
  ];
  const recommendation =
    safeToSpend === 0
      ? {
          title: "Protect the next payout",
          body: `Your current balance is fully needed for commitments, work costs, or the safety buffer until ${planningHorizon.toLocaleDateString("en-IN", { weekday: "long" })}.`,
          action: "Review alternatives",
        }
      : protectedDays < bundle.profile.cushionTargetDays
        ? {
            title: "Add one protected day",
            body: `Protect about ₹${Math.ceil(dailyEssential).toLocaleString("en-IN")} from the next settled payout to grow your cushion.`,
            action: "Plan contribution",
          }
        : {
            title: "Your plan is stable today",
            body: `You can use up to ₹${Math.floor(safeToSpend).toLocaleString("en-IN")} before the next expected payout while keeping the current plan protected.`,
            action: "View calculation",
          };
  const commitmentEvents = bundle.commitments
    .filter((item) => item.status !== "PAID")
    .map((item) => ({
      id: `commitment-${item.id}`,
      date: item.dueDate,
      type: "COMMITMENT" as const,
      title: item.title,
      amountMin: item.amount,
      amountMax: item.amount,
      status: item.status,
    }));
  const payoutEvents = activeSources
    .filter((item) => item.nextPayoutAt)
    .map((item) => ({
      id: `source-${item.id}`,
      date: item.nextPayoutAt!,
      type: "INCOME" as const,
      title: `${item.name} payout`,
      amountMin: item.typicalMin,
      amountMax: item.typicalMax,
      status: new Date(item.nextPayoutAt!) < now ? "OVERDUE" : "EXPECTED",
    }));
  const timeline = [...commitmentEvents, ...payoutEvents]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 7);
  const committedOutflow30d = bundle.commitments.reduce(
    (sum, commitment) => sum + recurrenceMonthly(commitment, now),
    0,
  );
  const sourceHistoryWeeks = Math.max(
    0,
    bundle.entries.filter((entry) => entry.kind === "INCOME").length /
      Math.max(1, activeSources.length),
  );
  const forecastConfidence =
    sourceHistoryWeeks >= 8
      ? "HIGH"
      : sourceHistoryWeeks >= 3
        ? "MEDIUM"
        : "LOW";
  const forecastIncomeLow30d = bundle.profile.lowWeekIncome * 4.345;
  const forecastIncomeHigh30d = bundle.profile.goodWeekIncome * 4.345;
  const estimatedWorkCosts30d = bundle.profile.weeklyWorkCosts * 4.345;
  const settledDelta = (entry: CashEntryDto) =>
    !["SETTLED", "PAID"].includes(entry.status)
      ? 0
      : entry.kind === "INCOME"
        ? entry.amount
        : [
              "WORK_EXPENSE",
              "ESSENTIAL_EXPENSE",
              "FLEXIBLE_EXPENSE",
              "COMMITMENT_PAYMENT",
            ].includes(entry.kind)
          ? -entry.amount
          : 0;
  const forecast: GigDashboardDto["forecast"] = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    const pointDate = new Date(todayStart.getTime() + offset * 86_400_000);
    const pointEnd = new Date(pointDate.getTime() + 86_400_000);
    const laterDelta = bundle.entries
      .filter(
        (entry) =>
          new Date(entry.date) >= pointEnd && new Date(entry.date) <= now,
      )
      .reduce((sum, entry) => sum + settledDelta(entry), 0);
    forecast.push({
      date: pointDate.toISOString(),
      actual:
        Math.round((bundle.profile.currentBalance - laterDelta) * 100) / 100,
      conservative: null,
      typical: null,
      optimistic: null,
      safetyFloor: bundle.profile.safetyBuffer,
    });
  }
  let conservativeBalance = bundle.profile.currentBalance;
  let typicalBalance = bundle.profile.currentBalance;
  let optimisticBalance = bundle.profile.currentBalance;
  let lowestProjectedBalanceLow = conservativeBalance;
  let lowestProjectedBalanceHigh = optimisticBalance;
  for (let offset = 1; offset <= 30; offset += 1) {
    const pointDate = new Date(todayStart.getTime() + offset * 86_400_000);
    const dayCommitments = bundle.commitments
      .filter(
        (item) =>
          item.status !== "PAID" &&
          startOfDay(new Date(item.dueDate)).getTime() === pointDate.getTime(),
      )
      .reduce(
        (sum, item) => sum + Math.max(0, item.amount - item.fundedAmount),
        0,
      );
    conservativeBalance +=
      bundle.profile.lowWeekIncome / 7 -
      bundle.profile.weeklyWorkCosts / 7 -
      dayCommitments;
    typicalBalance +=
      bundle.profile.typicalWeekIncome / 7 -
      bundle.profile.weeklyWorkCosts / 7 -
      dayCommitments;
    optimisticBalance +=
      bundle.profile.goodWeekIncome / 7 -
      bundle.profile.weeklyWorkCosts / 7 -
      dayCommitments;
    lowestProjectedBalanceLow = Math.min(
      lowestProjectedBalanceLow,
      conservativeBalance,
    );
    lowestProjectedBalanceHigh = Math.min(
      lowestProjectedBalanceHigh,
      optimisticBalance,
    );
    forecast.push({
      date: pointDate.toISOString(),
      actual: null,
      conservative: Math.round(conservativeBalance),
      typical: Math.round(typicalBalance),
      optimistic: Math.round(optimisticBalance),
      safetyFloor: bundle.profile.safetyBuffer,
    });
  }
  const freshnessTimes = [
    bundle.profile.updatedAt,
    bundle.splitRule.updatedAt,
    ...bundle.sources.map((item) => item.lastSyncAt ?? item.updatedAt),
    ...bundle.commitments.map((item) => item.updatedAt),
    ...bundle.pockets.map((item) => item.updatedAt),
    ...bundle.entries.map((item) => item.createdAt),
    ...bundle.payoutSplits.map((item) => item.createdAt),
  ]
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);
  const dataFreshnessAt = new Date(
    freshnessTimes.length ? Math.max(...freshnessTimes) : now.getTime(),
  ).toISOString();
  const workCostRatioPct =
    grossIncomeWeek > 0 ? (workCostsWeek / grossIncomeWeek) * 100 : 0;
  return {
    ...bundle,
    summary: {
      availableBalance: bundle.profile.currentBalance,
      safeToSpend,
      safeUntil: planningHorizon.toISOString(),
      protectedMoney,
      dueBeforeNextPayout,
      workCostsBeforeNextPayout: expectedWorkCosts,
      safetyBufferGap,
      expectedPayoutMin: nextSource?.typicalMin ?? 0,
      expectedPayoutMax: nextSource?.typicalMax ?? 0,
      grossIncomeWeek,
      workCostsWeek,
      allCostsWeek,
      cashChangeWeek,
      trueNetIncomeWeek,
      typicalWeekDeltaPct,
      protectedDays,
      cushionTargetDays: bundle.profile.cushionTargetDays,
      resilienceScore,
      resilienceStatus,
      forecastIncomeLow30d,
      forecastIncomeHigh30d,
      committedOutflow30d,
      estimatedWorkCosts30d,
      forecastConfidence,
      todayGrossIncome,
      activeSourceCount: activeSources.length,
      payoutStatus,
      nextPayoutAt: nextPayoutAt?.toISOString() ?? null,
      dataFreshnessAt,
      workCostRatioPct,
      lowestProjectedBalanceLow,
      lowestProjectedBalanceHigh,
    },
    timeline,
    forecast,
    resilienceFactors: factors,
    recommendation,
  };
}

const roundCurrency = (value: number) => Math.round(value * 100) / 100;
const MIN_ADAPTIVE_INVESTMENT_PCT = 3;
const pocketBalance = (bundle: GigBundleDto, kind: PocketKind) =>
  bundle.pockets.find((pocket) => pocket.kind === kind)?.currentAmount ?? 0;

export function projectPayoutSplit(
  bundle: GigBundleDto,
  amount: number,
  percentages: SplitPercentages,
  nowInput: Date | string = new Date(),
  sourceId?: string | null,
) {
  const safeAmount = Math.max(0, amount);
  const essentials = roundCurrency(
    (safeAmount * percentages.essentialsPct) / 100,
  );
  const workCosts = roundCurrency(
    (safeAmount * percentages.workCostsPct) / 100,
  );
  const emergency = roundCurrency(
    (safeAmount * percentages.emergencyPct) / 100,
  );
  const longTerm = roundCurrency((safeAmount * percentages.longTermPct) / 100);
  const flexible = roundCurrency(
    safeAmount - essentials - workCosts - emergency - longTerm,
  );
  const additions: Record<PocketKind, number> = {
    ESSENTIALS: essentials,
    WORK_COSTS: workCosts,
    EMERGENCY_CUSHION: emergency,
    LONG_TERM_SAVINGS: longTerm,
    FLEXIBLE_SPENDING: flexible,
  };
  const projectedBundle: GigBundleDto = {
    ...bundle,
    profile: {
      ...bundle.profile,
      currentBalance: bundle.profile.currentBalance + safeAmount,
    },
    pockets: bundle.pockets.map((pocket) => ({
      ...pocket,
      currentAmount: pocket.currentAmount + additions[pocket.kind],
    })),
    sources: bundle.sources.map((source) => {
      if (!sourceId || source.id !== sourceId) return source;
      const nextPayoutAt = nextExpectedPayoutAt(
        source.frequency,
        source.nextPayoutAt ? new Date(source.nextPayoutAt).getTime() : null,
        new Date(nowInput).getTime(),
      );
      return {
        ...source,
        nextPayoutAt: nextPayoutAt
          ? new Date(nextPayoutAt).toISOString()
          : source.nextPayoutAt,
      };
    }),
  };
  const before = calculateGigDashboard(bundle, nowInput);
  const after = calculateGigDashboard(projectedBundle, nowInput);
  return {
    amounts: { essentials, workCosts, emergency, longTerm, flexible },
    beforeSafeAmount: before.summary.safeToSpend,
    afterSafeAmount: after.summary.safeToSpend,
    beforeProtectedDays: before.summary.protectedDays,
    afterProtectedDays: after.summary.protectedDays,
  };
}

export function recommendAdaptiveSplit(
  bundle: GigBundleDto,
  amountInput: number,
  nowInput: Date | string = new Date(),
  sourceId?: string | null,
): AdaptiveSplitRecommendation {
  const amount = roundCurrency(Math.max(0, amountInput));
  const dashboard = calculateGigDashboard(bundle, nowInput);
  const nextPayout = new Date(dashboard.summary.safeUntil);
  const essentialsPocket = pocketBalance(bundle, "ESSENTIALS");
  const workPocket = pocketBalance(bundle, "WORK_COSTS");
  const cushionPocket = pocketBalance(bundle, "EMERGENCY_CUSHION");
  const due = bundle.commitments
    .filter(
      (item) =>
        item.essential &&
        item.status !== "PAID" &&
        new Date(item.dueDate) <= nextPayout,
    )
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  const assignedEssentialMoney = due.reduce(
    (sum, item) => sum + Math.min(item.amount, item.fundedAmount),
    0,
  );
  const unassignedEssentialMoney = Math.max(
    0,
    essentialsPocket - assignedEssentialMoney,
  );
  const dueGap = Math.max(
    0,
    due.reduce(
      (sum, item) => sum + Math.max(0, item.amount - item.fundedAmount),
      0,
    ) - unassignedEssentialMoney,
  );
  const workGap = Math.max(
    0,
    dashboard.summary.workCostsBeforeNextPayout - workPocket,
  );
  const dailyProtectedCost =
    dashboard.summary.protectedDays > 0
      ? cushionPocket / dashboard.summary.protectedDays
      : Math.max(1, bundle.profile.weeklyWorkCosts / 7);
  const cushionStep = Math.max(
    0,
    Math.min(
      dailyProtectedCost,
      Math.max(
        bundle.profile.safetyBuffer,
        cushionPocket + dailyProtectedCost,
      ) - cushionPocket,
    ),
  );
  const confidenceReserve =
    dashboard.summary.forecastConfidence === "LOW"
      ? amount * 0.1
      : dashboard.summary.forecastConfidence === "MEDIUM"
        ? amount * 0.05
        : 0;
  let remaining = amount;
  const priority = {
    essentials: 0,
    workCosts: 0,
    emergency: 0,
    longTerm: 0,
    flexible: 0,
  };
  const take = (wanted: number) => {
    const value = roundCurrency(Math.min(remaining, Math.max(0, wanted)));
    remaining = roundCurrency(remaining - value);
    return value;
  };
  priority.essentials = take(dueGap);
  priority.workCosts = take(workGap);
  priority.emergency = take(Math.max(cushionStep, confidenceReserve));
  const investmentTargetPct = Math.max(
    MIN_ADAPTIVE_INVESTMENT_PCT,
    bundle.splitRule.longTermPct,
  );
  priority.longTerm = take((amount * investmentTargetPct) / 100);
  const defaults: Array<[keyof typeof priority, number]> = [
    ["essentials", bundle.splitRule.essentialsPct],
    ["workCosts", bundle.splitRule.workCostsPct],
    ["emergency", bundle.splitRule.emergencyPct],
    ["flexible", bundle.splitRule.flexiblePct],
  ];
  const distributable = remaining;
  for (const [key, percentage] of defaults.slice(0, -1)) {
    const value = roundCurrency((distributable * percentage) / 100);
    priority[key] += value;
    remaining = roundCurrency(remaining - value);
  }
  priority.flexible += remaining;
  const rounded = {
    essentials: roundCurrency(priority.essentials),
    workCosts: roundCurrency(priority.workCosts),
    emergency: roundCurrency(priority.emergency),
    longTerm: roundCurrency(priority.longTerm),
    flexible: 0,
  };
  rounded.flexible = roundCurrency(
    amount -
      rounded.essentials -
      rounded.workCosts -
      rounded.emergency -
      rounded.longTerm,
  );
  const percentages: SplitPercentages =
    amount > 0
      ? {
          essentialsPct: roundCurrency((rounded.essentials / amount) * 100),
          workCostsPct: roundCurrency((rounded.workCosts / amount) * 100),
          emergencyPct: roundCurrency((rounded.emergency / amount) * 100),
          longTermPct: roundCurrency((rounded.longTerm / amount) * 100),
          flexiblePct: 0,
        }
      : {
          essentialsPct: 0,
          workCostsPct: 0,
          emergencyPct: 0,
          longTermPct: 0,
          flexiblePct: 100,
        };
  percentages.flexiblePct = roundCurrency(
    100 -
      percentages.essentialsPct -
      percentages.workCostsPct -
      percentages.emergencyPct -
      percentages.longTermPct,
  );
  let newEssentialMoney = rounded.essentials;
  const fundedCommitments: AdaptiveSplitRecommendation["fundedCommitments"] =
    [];
  for (const item of due) {
    if (newEssentialMoney <= 0) break;
    const funding = roundCurrency(
      Math.min(newEssentialMoney, Math.max(0, item.amount - item.fundedAmount)),
    );
    if (funding > 0)
      fundedCommitments.push({
        id: item.id,
        title: item.title,
        amount: funding,
      });
    newEssentialMoney -= funding;
  }
  const projection = projectPayoutSplit(
    bundle,
    amount,
    percentages,
    nowInput,
    sourceId,
  );
  const reasons: string[] = [];
  if (dueGap > 0)
    reasons.push(
      `Protect ${fundedCommitments.length || due.length} commitment${(fundedCommitments.length || due.length) === 1 ? "" : "s"} due before the next likely payout.`,
    );
  if (workGap > 0)
    reasons.push(
      "Keep enough fuel, fees, and maintenance money available to continue earning.",
    );
  if (rounded.emergency > 0)
    reasons.push(
      `Add about ${Math.max(0, projection.afterProtectedDays - projection.beforeProtectedDays).toFixed(1)} protected ${Math.abs(projection.afterProtectedDays - projection.beforeProtectedDays - 1) < 0.05 ? "day" : "days"} to the emergency cushion.`,
    );
  if (rounded.longTerm > 0)
    reasons.push(
      `Keep ${percentages.longTermPct}% as an investment goal. SuperFinz plans this amount but does not invest or move it.`,
    );
  if (!reasons.length)
    reasons.push(
      "Your near-term essentials and earning costs are covered, so the default rule can guide this payout.",
    );
  return {
    percentages,
    amounts: rounded,
    beforeSafeAmount: projection.beforeSafeAmount,
    afterSafeAmount: projection.afterSafeAmount,
    beforeProtectedDays: projection.beforeProtectedDays,
    afterProtectedDays: projection.afterProtectedDays,
    fundedCommitments,
    reasons,
  };
}

export function simulateGigScenario(
  dashboard: GigDashboardDto,
  input: GigScenarioInput,
): GigScenarioResult {
  const incomeFactor = Math.max(0, 1 + input.incomeChangePct / 100);
  const averageWorkdayIncome =
    dashboard.profile.typicalWeekIncome /
    Math.max(1, dashboard.profile.workDaysPerWeek);
  const incomeLostToTimeOff =
    averageWorkdayIncome * Math.max(0, input.workDaysOff);
  const forecastIncomeLow30d = Math.max(
    0,
    dashboard.summary.forecastIncomeLow30d * incomeFactor - incomeLostToTimeOff,
  );
  const forecastIncomeHigh30d = Math.max(
    forecastIncomeLow30d,
    dashboard.summary.forecastIncomeHigh30d * incomeFactor -
      incomeLostToTimeOff,
  );
  const adjustedWorkCosts =
    dashboard.summary.estimatedWorkCosts30d *
    Math.max(0, 1 + input.workCostChangePct / 100);
  const delayReserve =
    (dashboard.profile.weeklyWorkCosts /
      Math.max(1, dashboard.profile.workDaysPerWeek)) *
    Math.max(0, input.payoutDelayDays);
  const originalPayout = new Date(dashboard.summary.safeUntil);
  const delayedPayout = new Date(
    originalPayout.getTime() + Math.max(0, input.payoutDelayDays) * 86_400_000,
  );
  const extraBillsDuringDelay = dashboard.commitments
    .filter(
      (item) =>
        item.essential &&
        item.status !== "PAID" &&
        new Date(item.dueDate) > originalPayout &&
        new Date(item.dueDate) <= delayedPayout,
    )
    .reduce(
      (sum, item) => sum + Math.max(0, item.amount - item.fundedAmount),
      0,
    );
  const surpriseCost = Math.max(0, input.surpriseCost);
  const safeToSpend = Math.max(
    0,
    dashboard.summary.safeToSpend -
      delayReserve -
      extraBillsDuringDelay -
      surpriseCost,
  );
  const cushion = pocketBalance(dashboard, "EMERGENCY_CUSHION");
  const cushionUsed = Math.max(0, surpriseCost - dashboard.summary.safeToSpend);
  const protectedDays =
    dashboard.summary.protectedDays *
    (cushion > 0 ? Math.max(0, cushion - cushionUsed) / cushion : 0);
  const endOfMonthLow =
    dashboard.profile.currentBalance +
    forecastIncomeLow30d -
    dashboard.summary.committedOutflow30d -
    adjustedWorkCosts -
    surpriseCost -
    delayReserve;
  const beforeNextPayoutLow =
    dashboard.profile.currentBalance -
    dashboard.summary.dueBeforeNextPayout -
    dashboard.summary.workCostsBeforeNextPayout -
    extraBillsDuringDelay -
    surpriseCost -
    delayReserve;
  const lowestProjectedBalance = Math.min(endOfMonthLow, beforeNextPayoutLow);
  const gap = Math.max(
    0,
    dashboard.profile.safetyBuffer - lowestProjectedBalance,
  );
  let uncovered = gap;
  const atRiskCommitments: GigScenarioResult["atRiskCommitments"] = [];
  for (const item of [...dashboard.commitments]
    .filter((item) => item.essential && item.status !== "PAID")
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )) {
    if (uncovered <= 0) break;
    atRiskCommitments.push({
      id: item.id,
      title: item.title,
      amount: item.amount,
      dueDate: item.dueDate,
    });
    uncovered -= item.amount;
  }
  const remainingWorkdays = Math.max(
    1,
    Math.round(
      dashboard.profile.workDaysPerWeek * 4.345 -
        Math.max(0, input.workDaysOff),
    ),
  );
  const targetPerRemainingWorkday = gap / remainingWorkdays;
  const recommendedAction =
    gap > 0
      ? `Close the verified ${Math.round(gap).toLocaleString("en-IN")} rupee gap before adding flexible spending.`
      : safeToSpend === 0
        ? "Pause flexible spending until the next settled payout."
        : "The protected plan still holds in this scenario.";
  const nonCreditAlternatives =
    gap > 0
      ? [
          "Reschedule the lowest-priority flexible commitment.",
          `Set a net earning target of ₹${Math.ceil(targetPerRemainingWorkday).toLocaleString("en-IN")} per remaining workday.`,
          "Use only the necessary part of the cushion after flexible money.",
        ]
      : [
          "Keep the current Smart Split rule.",
          "Update the scenario if the payout date changes.",
        ];
  return {
    safeToSpend: roundCurrency(safeToSpend),
    forecastIncomeLow30d: roundCurrency(forecastIncomeLow30d),
    forecastIncomeHigh30d: roundCurrency(forecastIncomeHigh30d),
    lowestProjectedBalance: roundCurrency(lowestProjectedBalance),
    protectedDays: Math.max(0, protectedDays),
    earningTarget: roundCurrency(gap),
    targetPerRemainingWorkday: roundCurrency(targetPerRemainingWorkday),
    atRiskCommitments,
    recommendedAction,
    nonCreditAlternatives,
  };
}

export function deriveGigInsights(dashboard: GigDashboardDto): GigInsightsDto {
  const summary = dashboard.summary;
  const lowestBalanceLow = roundCurrency(summary.lowestProjectedBalanceLow);
  const lowestBalanceHigh = roundCurrency(summary.lowestProjectedBalanceHigh);
  const safetyFloor = roundCurrency(dashboard.profile.safetyBuffer);
  const gapToSafetyFloor = roundCurrency(
    Math.max(0, safetyFloor - lowestBalanceLow),
  );
  const status =
    lowestBalanceLow < 0
      ? "AT_RISK"
      : lowestBalanceLow < safetyFloor
        ? "WATCH"
        : "ON_TRACK";
  const outlookCopy =
    status === "AT_RISK"
      ? {
          title: "A weak month may create a gap",
          body: `Protect another ₹${Math.ceil(gapToSafetyFloor).toLocaleString("en-IN")} or adjust a flexible cost before it becomes urgent.`,
        }
      : status === "WATCH"
        ? {
            title: "Your plan stays above zero, but the cushion is thin",
            body: `The low estimate falls below your ₹${Math.round(safetyFloor).toLocaleString("en-IN")} safety floor. Keep the next payout conservative.`,
          }
        : {
            title: "Your 30-day plan holds in the low estimate",
            body: "The projected low point stays above your chosen safety floor. Keep recording payouts and work costs.",
          };

  const hasActualIncome = summary.grossIncomeWeek > 0;
  const gross = hasActualIncome
    ? summary.grossIncomeWeek
    : dashboard.profile.typicalWeekIncome;
  const workCosts = hasActualIncome
    ? summary.workCostsWeek
    : dashboard.profile.weeklyWorkCosts;
  const net = gross - workCosts;
  const workCostPerHundred =
    gross > 0 ? Math.max(0, (workCosts / gross) * 100) : 0;
  const keptPerHundred = gross > 0 ? (net / gross) * 100 : 0;

  return {
    outlook: {
      lowestBalanceLow,
      lowestBalanceHigh,
      safetyFloor,
      gapToSafetyFloor,
      status,
      title: outlookCopy.title,
      body: outlookCopy.body,
    },
    earnings: {
      basis: hasActualIncome ? "ACTUAL_WEEK" : "TYPICAL_WEEK",
      gross: roundCurrency(gross),
      workCosts: roundCurrency(workCosts),
      net: roundCurrency(net),
      workCostPerHundred: roundCurrency(workCostPerHundred),
      keptPerHundred: roundCurrency(keptPerHundred),
      changeFromTypicalPct: roundCurrency(summary.typicalWeekDeltaPct),
    },
    month: {
      forecastIncomeLow: roundCurrency(summary.forecastIncomeLow30d),
      forecastIncomeHigh: roundCurrency(summary.forecastIncomeHigh30d),
      committedOutflow: roundCurrency(summary.committedOutflow30d),
      estimatedWorkCosts: roundCurrency(summary.estimatedWorkCosts30d),
      confidence: summary.forecastConfidence,
    },
  };
}

export function deriveGigNotifications(
  dashboard: GigDashboardDto,
  preferences: GigPreferencesDto,
  states: GigNotificationStateDto[] = [],
  nowInput: Date | string = new Date(),
): GigNotificationDto[] {
  if (!preferences.inAppEnabled) return [];
  const now = new Date(nowInput);
  const stateByKey = new Map(states.map((state) => [state.key, state]));
  const notices: GigNotificationDto[] = [];
  const add = (notice: Omit<GigNotificationDto, "read">) => {
    if (!preferences.alertCategories.includes(notice.category)) return;
    const state = stateByKey.get(notice.id);
    if (
      state?.dismissedAt ||
      (state?.snoozedUntil && new Date(state.snoozedUntil) > now)
    )
      return;
    notices.push({ ...notice, read: Boolean(state?.readAt) });
  };
  const daysFromNow = (value: string) =>
    (new Date(value).getTime() - now.getTime()) / 86_400_000;
  const s = dashboard.summary;

  for (const source of dashboard.sources.filter(
    (item) => item.status === "ACTIVE" && item.nextPayoutAt,
  )) {
    const days = daysFromNow(source.nextPayoutAt!);
    if (days < -0.5)
      add({
        id: `payout-delayed:${source.id}:${source.nextPayoutAt}`,
        category: "PAYOUTS",
        severity: "WARNING",
        title: `${source.name} payout may be delayed`,
        body: `The expected date passed. Keep the estimated payout separate from settled money and update the source when it arrives.`,
        actionLabel: "Review source",
        actionHref: "/dashboard/income?tab=sources",
        createdAt: source.nextPayoutAt!,
      });
    else if (days <= preferences.reminderDaysBefore)
      add({
        id: `payout-expected:${source.id}:${source.nextPayoutAt}`,
        category: "PAYOUTS",
        severity: "INFO",
        title: `${source.name} payout expected soon`,
        body: `${formatRupees(source.typicalMin)}–${formatRupees(source.typicalMax)} is expected in about ${Math.max(0, Math.ceil(days))} day${Math.ceil(days) === 1 ? "" : "s"}. Record it only after it settles.`,
        actionLabel: "Record when settled",
        actionHref: "/dashboard/income?panel=payout",
        createdAt: source.nextPayoutAt!,
      });
  }

  for (const item of dashboard.commitments.filter(
    (commitment) => commitment.status !== "PAID",
  )) {
    const days = daysFromNow(item.dueDate);
    if (days >= -0.5 && days <= preferences.reminderDaysBefore)
      add({
        id: `commitment-due:${item.id}:${item.dueDate}`,
        category: "COMMITMENTS",
        severity: item.essential ? "ACTION" : "INFO",
        title: `${item.title} is due soon`,
        body: `${formatRupees(Math.max(0, item.amount - item.fundedAmount))} remains to be protected or paid by ${new Date(item.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.`,
        actionLabel: "Open plan",
        actionHref: "/dashboard/plan",
        createdAt: item.dueDate,
      });
  }

  if (s.safeToSpend <= Math.max(500, dashboard.profile.safetyBuffer * 0.5))
    add({
      id: `safe-low:${new Date(s.safeUntil).toISOString().slice(0, 10)}`,
      category: "SAFETY",
      severity: s.safeToSpend <= 0 ? "WARNING" : "ACTION",
      title:
        s.safeToSpend <= 0
          ? "Pause flexible spending"
          : "Safe-to-spend is running low",
      body: `${formatRupees(s.safeToSpend)} is currently safe until ${new Date(s.safeUntil).toLocaleDateString("en-IN", { weekday: "long" })}. Expected income is not counted yet.`,
      actionLabel: "View calculation",
      actionHref: "/dashboard",
      createdAt: s.dataFreshnessAt,
    });
  if (s.lowestProjectedBalanceLow < dashboard.profile.safetyBuffer)
    add({
      id: `safety-floor:${Math.round(s.lowestProjectedBalanceLow)}:${new Date(s.safeUntil).toISOString().slice(0, 10)}`,
      category: "SAFETY",
      severity: "WARNING",
      title: "Low-case forecast crosses your safety floor",
      body: `The conservative balance reaches ${formatRupees(s.lowestProjectedBalanceLow)}, below your ${formatRupees(dashboard.profile.safetyBuffer)} floor. Test a delay or lower-income scenario.`,
      actionLabel: "Test a scenario",
      actionHref: "/dashboard/plan#scenarios",
      createdAt: s.dataFreshnessAt,
    });
  if (s.typicalWeekDeltaPct <= -15)
    add({
      id: `income-low:${new Date(s.dataFreshnessAt).toISOString().slice(0, 10)}`,
      category: "INCOME",
      severity: "ACTION",
      title: "True take-home is below your typical week",
      body: `Recorded true net income is ${Math.abs(Math.round(s.typicalWeekDeltaPct))}% below your usual estimate. Review missing income and work-cost entries.`,
      actionLabel: "Review cashbook",
      actionHref: "/dashboard/income?tab=cashbook",
      createdAt: s.dataFreshnessAt,
    });
  if (s.workCostRatioPct >= 25)
    add({
      id: `work-cost-spike:${new Date(s.dataFreshnessAt).toISOString().slice(0, 10)}`,
      category: "WORK_COSTS",
      severity: "ACTION",
      title: "Work costs need a quick check",
      body: `Recorded work costs are ${s.workCostRatioPct.toFixed(1)}% of this week’s gross income. Check fuel, fees, and repair entries before planning flexible spending.`,
      actionLabel: "Review work costs",
      actionHref: "/dashboard/income?tab=cashbook",
      createdAt: s.dataFreshnessAt,
    });
  if (s.protectedDays < s.cushionTargetDays)
    add({
      id: `cushion-step:${Math.floor(s.protectedDays)}`,
      category: "SAFETY",
      severity: "INFO",
      title: "The next payout can add one protected day",
      body: `Your cushion covers about ${Math.floor(s.protectedDays)} ${Math.floor(s.protectedDays) === 1 ? "day" : "days"} toward a ${s.cushionTargetDays}-day goal. Smart Split will adapt the next settled payout.`,
      actionLabel: "Plan next payout",
      actionHref: "/dashboard/income?panel=payout",
      createdAt: s.dataFreshnessAt,
    });
  for (const pocket of dashboard.pockets.filter(
    (item) => item.targetAmount > 0 && item.currentAmount >= item.targetAmount,
  ))
    add({
      id: `pocket-target:${pocket.id}:${Math.round(pocket.targetAmount)}`,
      category: "SAFETY",
      severity: "INFO",
      title: `${pocket.kind.toLowerCase().replaceAll("_", " ")} target reached`,
      body: `${formatRupees(pocket.currentAmount)} is now protected in this planning pocket.`,
      actionLabel: "View protection",
      actionHref: "/dashboard/safety",
      createdAt: pocket.updatedAt,
    });
  for (const source of dashboard.sources.filter(
    (item) => item.status === "ERROR",
  ))
    add({
      id: `source-error:${source.id}`,
      category: "CONNECTIONS",
      severity: "WARNING",
      title: `${source.name} needs attention`,
      body: "The source could not refresh. Your forecast is using the last available details.",
      actionLabel: "Reconnect",
      actionHref: "/dashboard/income?tab=sources",
      createdAt: source.updatedAt,
    });
  for (const source of dashboard.sources.filter(
    (item) =>
      item.consentExpiresAt &&
      daysFromNow(item.consentExpiresAt) <= 14 &&
      daysFromNow(item.consentExpiresAt) >= 0,
  ))
    add({
      id: `consent-expiry:${source.id}:${source.consentExpiresAt}`,
      category: "CONNECTIONS",
      severity: "ACTION",
      title: `${source.name} consent expires soon`,
      body: `Review the data types and purpose before deciding whether to renew this simulated connection.`,
      actionLabel: "Review consent",
      actionHref: "/dashboard/income?tab=sources",
      createdAt: source.consentExpiresAt!,
    });
  const weakest = [...dashboard.resilienceFactors].sort(
    (a, b) => a.score - b.score,
  )[0];
  if (weakest && weakest.score < 50)
    add({
      id: `resilience-factor:${weakest.key}:${weakest.score}`,
      category: "RESILIENCE",
      severity: "INFO",
      title: `${weakest.label} can improve`,
      body: `${weakest.evidence} ${weakest.action}`,
      actionLabel: "Open Passport",
      actionHref: "/dashboard/safety",
      createdAt: s.dataFreshnessAt,
    });

  const priority = { WARNING: 0, ACTION: 1, INFO: 2 } as const;
  return notices
    .sort(
      (a, b) =>
        Number(a.read) - Number(b.read) ||
        priority[a.severity] - priority[b.severity] ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .slice(0, 20);
}

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
