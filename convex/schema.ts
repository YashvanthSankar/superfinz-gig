import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const userType = v.union(
  v.literal("SCHOOL_STUDENT"),
  v.literal("COLLEGE_STUDENT"),
  v.literal("PROFESSIONAL"),
);

export default defineSchema({
  users: defineTable({
    externalId: v.optional(v.string()),
    email: v.string(),
    googleId: v.optional(v.string()),
    avatar: v.optional(v.string()),
    name: v.string(),
    age: v.number(),
    userType,
    onboarded: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_email", ["email"])
    .index("by_google_id", ["googleId"]),

  profiles: defineTable({
    externalId: v.optional(v.string()),
    userId: v.string(),
    institution: v.optional(v.string()),
    monthlyAllowance: v.optional(v.number()),
    incomeSources: v.array(v.string()),
    company: v.optional(v.string()),
    monthlySalary: v.optional(v.number()),
    industry: v.optional(v.string()),
    monthlyBudget: v.number(),
    savingsGoal: v.number(),
    currency: v.string(),
    spendingPattern: v.string(),
    cycleStartDate: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_user_id", ["userId"]),

  mobileSessions: defineTable({
    externalId: v.optional(v.string()),
    userId: v.string(),
    refreshTokenHash: v.string(),
    deviceLabel: v.optional(v.string()),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_user_id", ["userId"])
    .index("by_refresh_hash", ["refreshTokenHash"])
    .index("by_expires_at", ["expiresAt"]),

  transactions: defineTable({
    externalId: v.optional(v.string()),
    userId: v.string(),
    amount: v.number(),
    category: v.string(),
    description: v.string(),
    isNecessary: v.optional(v.boolean()),
    aiNote: v.optional(v.string()),
    date: v.number(),
    createdAt: v.number(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_user_date", ["userId", "date"]),

  budgets: defineTable({
    externalId: v.optional(v.string()),
    userId: v.string(),
    category: v.string(),
    limit: v.number(),
    month: v.number(),
    year: v.number(),
    spent: v.number(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_user_period", ["userId", "year", "month"]),

  goals: defineTable({
    externalId: v.optional(v.string()),
    userId: v.string(),
    title: v.string(),
    targetAmount: v.number(),
    savedAmount: v.number(),
    deadline: v.optional(v.number()),
    achieved: v.boolean(),
    isEssential: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_user_created", ["userId", "createdAt"]),

  gigProfiles: defineTable({
    userId: v.string(),
    preferredName: v.string(),
    city: v.string(),
    preferredLanguage: v.string(),
    workTypes: v.array(v.string()),
    primaryPriority: v.string(),
    lowWeekIncome: v.number(),
    typicalWeekIncome: v.number(),
    goodWeekIncome: v.number(),
    workDaysPerWeek: v.number(),
    platformDeductionRate: v.number(),
    weeklyWorkCosts: v.number(),
    openingBalance: v.number(),
    currentBalance: v.number(),
    safetyBuffer: v.number(),
    cushionTargetDays: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  gigIncomeSources: defineTable({
    userId: v.string(),
    name: v.string(),
    type: v.string(),
    frequency: v.string(),
    typicalMin: v.number(),
    typicalMax: v.number(),
    payoutDay: v.optional(v.number()),
    nextPayoutAt: v.optional(v.number()),
    connectionMode: v.string(),
    status: v.string(),
    prototype: v.boolean(),
    consentAt: v.optional(v.number()),
    consentExpiresAt: v.optional(v.number()),
    lastSyncAt: v.optional(v.number()),
    dataTypes: v.optional(v.array(v.string())),
    purpose: v.optional(v.string()),
    consentReceiptId: v.optional(v.string()),
    consentFrom: v.optional(v.number()),
    consentTo: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  gigCashEntries: defineTable({
    userId: v.string(),
    kind: v.string(),
    amount: v.number(),
    sourceId: v.optional(v.string()),
    sourceName: v.optional(v.string()),
    category: v.string(),
    paymentMethod: v.string(),
    note: v.optional(v.string()),
    workRelated: v.boolean(),
    recurring: v.optional(v.boolean()),
    status: v.string(),
    pocketDebit: v.optional(v.number()),
    payoutSplitId: v.optional(v.string()),
    commitmentId: v.optional(v.string()),
    commitmentDueDate: v.optional(v.number()),
    commitmentPreviousPaidAt: v.optional(v.number()),
    date: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_user_date", ["userId", "date"]),

  gigCommitments: defineTable({
    userId: v.string(),
    title: v.string(),
    category: v.string(),
    amount: v.number(),
    dueDate: v.number(),
    recurrence: v.string(),
    essential: v.boolean(),
    priority: v.number(),
    autopay: v.boolean(),
    fundedAmount: v.number(),
    status: v.string(),
    lastPaidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_due", ["userId", "dueDate"]),

  gigPockets: defineTable({
    userId: v.string(),
    kind: v.string(),
    currentAmount: v.number(),
    targetAmount: v.number(),
    updatedAt: v.number(),
  }).index("by_user_kind", ["userId", "kind"]),

  gigSplitRules: defineTable({
    userId: v.string(),
    essentialsPct: v.number(),
    workCostsPct: v.number(),
    emergencyPct: v.number(),
    longTermPct: v.number(),
    flexiblePct: v.number(),
    enabled: v.boolean(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  gigPayoutSplits: defineTable({
    userId: v.string(),
    sourceId: v.optional(v.string()),
    sourceName: v.string(),
    amount: v.number(),
    receivedAt: v.number(),
    essentialsAmount: v.number(),
    workCostsAmount: v.number(),
    emergencyAmount: v.number(),
    longTermAmount: v.number(),
    flexibleAmount: v.number(),
    note: v.optional(v.string()),
    allocationMode: v.optional(v.string()),
    beforeSafeAmount: v.optional(v.number()),
    afterSafeAmount: v.optional(v.number()),
    beforeProtectedDays: v.optional(v.number()),
    afterProtectedDays: v.optional(v.number()),
    fundedCommitmentIds: v.optional(v.array(v.string())),
    fundedCommitments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          amount: v.number(),
        }),
      ),
    ),
    sourceScheduleCaptured: v.optional(v.boolean()),
    previousNextPayoutAt: v.optional(v.number()),
    previousLastSyncAt: v.optional(v.number()),
    recommendationReason: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user_received", ["userId", "receivedAt"]),

  gigPreferences: defineTable({
    userId: v.string(),
    inAppEnabled: v.boolean(),
    pushEnabled: v.boolean(),
    smsEnabled: v.boolean(),
    whatsappEnabled: v.boolean(),
    alertCategories: v.array(v.string()),
    quietHoursStart: v.string(),
    quietHoursEnd: v.string(),
    reminderDaysBefore: v.number(),
    largerText: v.boolean(),
    higherContrast: v.boolean(),
    reducedMotion: v.boolean(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  gigNotificationStates: defineTable({
    userId: v.string(),
    key: v.string(),
    readAt: v.optional(v.number()),
    dismissedAt: v.optional(v.number()),
    snoozedUntil: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_key", ["userId", "key"]),

  gigOutcomeEvents: defineTable({
    userId: v.string(),
    type: v.string(),
    value: v.optional(v.number()),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_type_created", ["type", "createdAt"]),
});
