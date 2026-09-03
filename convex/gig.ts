import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";

type ReadCtx = QueryCtx | MutationCtx;

function assertServerKey(value: string) {
  const configured = process.env.SUPERFINZ_SERVER_KEY;
  if (!configured || value !== configured) throw new Error("Unauthorized");
}

const iso = (value?: number) =>
  value === undefined ? null : new Date(value).toISOString();
const publicId = (doc: { _id: string }) => doc._id;

async function findUser(ctx: ReadCtx, id: string) {
  const nativeId = ctx.db.normalizeId("users", id);
  if (nativeId) {
    const user = await ctx.db.get(nativeId);
    if (user) return user;
  }
  return await ctx.db
    .query("users")
    .withIndex("by_external_id", (q) => q.eq("externalId", id))
    .unique();
}

async function findEntry(ctx: ReadCtx, id: string) {
  const nativeId = ctx.db.normalizeId("gigCashEntries", id);
  return nativeId ? await ctx.db.get(nativeId) : null;
}

async function findSource(ctx: ReadCtx, id: string) {
  const nativeId = ctx.db.normalizeId("gigIncomeSources", id);
  return nativeId ? await ctx.db.get(nativeId) : null;
}

async function findCommitment(ctx: ReadCtx, id: string) {
  const nativeId = ctx.db.normalizeId("gigCommitments", id);
  return nativeId ? await ctx.db.get(nativeId) : null;
}

const sourceValidator = v.object({
  name: v.string(),
  type: v.string(),
  frequency: v.string(),
  typicalMin: v.number(),
  typicalMax: v.number(),
  payoutDay: v.optional(v.number()),
  nextPayoutAt: v.optional(v.number()),
  connectionMode: v.string(),
  prototype: v.boolean(),
  dataTypes: v.optional(v.array(v.string())),
  purpose: v.optional(v.string()),
  consentFrom: v.optional(v.number()),
  consentTo: v.optional(v.number()),
});
const commitmentValidator = v.object({
  title: v.string(),
  category: v.string(),
  amount: v.number(),
  dueDate: v.number(),
  recurrence: v.string(),
  essential: v.boolean(),
  priority: v.number(),
  autopay: v.boolean(),
});
const splitRuleValidator = v.object({
  essentialsPct: v.number(),
  workCostsPct: v.number(),
  emergencyPct: v.number(),
  longTermPct: v.number(),
  flexiblePct: v.number(),
  enabled: v.boolean(),
});
const preferencesValidator = v.object({
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
});
const defaultPreferences = {
  inAppEnabled: true,
  pushEnabled: false,
  smsEnabled: false,
  whatsappEnabled: false,
  alertCategories: [
    "PAYOUTS",
    "COMMITMENTS",
    "SAFETY",
    "INCOME",
    "WORK_COSTS",
    "CONNECTIONS",
    "RESILIENCE",
    "BENEFITS",
  ],
  quietHoursStart: "21:00",
  quietHoursEnd: "07:00",
  reminderDaysBefore: 3,
  largerText: false,
  higherContrast: false,
  reducedMotion: false,
};

function toProfile(doc: Doc<"gigProfiles">) {
  return {
    id: publicId(doc),
    userId: doc.userId,
    preferredName: doc.preferredName,
    city: doc.city,
    preferredLanguage: doc.preferredLanguage,
    workTypes: doc.workTypes,
    primaryPriority: doc.primaryPriority,
    lowWeekIncome: doc.lowWeekIncome,
    typicalWeekIncome: doc.typicalWeekIncome,
    goodWeekIncome: doc.goodWeekIncome,
    workDaysPerWeek: doc.workDaysPerWeek,
    platformDeductionRate: doc.platformDeductionRate,
    weeklyWorkCosts: doc.weeklyWorkCosts,
    openingBalance: doc.openingBalance,
    currentBalance: doc.currentBalance,
    safetyBuffer: doc.safetyBuffer,
    cushionTargetDays: doc.cushionTargetDays,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}
function toSource(doc: Doc<"gigIncomeSources">) {
  return {
    id: publicId(doc),
    userId: doc.userId,
    name: doc.name,
    type: doc.type,
    frequency: doc.frequency,
    typicalMin: doc.typicalMin,
    typicalMax: doc.typicalMax,
    payoutDay: doc.payoutDay ?? null,
    nextPayoutAt: iso(doc.nextPayoutAt),
    connectionMode: doc.connectionMode,
    status: doc.status,
    prototype: doc.prototype,
    consentAt: iso(doc.consentAt),
    consentExpiresAt: iso(doc.consentExpiresAt),
    lastSyncAt: iso(doc.lastSyncAt),
    dataTypes: doc.dataTypes ?? [],
    purpose: doc.purpose ?? null,
    consentReceiptId: doc.consentReceiptId ?? null,
    consentFrom: iso(doc.consentFrom),
    consentTo: iso(doc.consentTo),
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}
function toEntry(doc: Doc<"gigCashEntries">) {
  return {
    id: publicId(doc),
    userId: doc.userId,
    kind: doc.kind,
    amount: doc.amount,
    sourceId: doc.sourceId ?? null,
    sourceName: doc.sourceName ?? null,
    category: doc.category,
    paymentMethod: doc.paymentMethod,
    note: doc.note ?? null,
    workRelated: doc.workRelated,
    recurring: doc.recurring ?? false,
    status: doc.status,
    pocketDebit: doc.pocketDebit ?? null,
    payoutSplitId: doc.payoutSplitId ?? null,
    commitmentId: doc.commitmentId ?? null,
    commitmentDueDate: iso(doc.commitmentDueDate),
    date: new Date(doc.date).toISOString(),
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: iso(doc.updatedAt) ?? new Date(doc.createdAt).toISOString(),
  };
}
function toCommitment(doc: Doc<"gigCommitments">) {
  return {
    id: publicId(doc),
    userId: doc.userId,
    title: doc.title,
    category: doc.category,
    amount: doc.amount,
    dueDate: new Date(doc.dueDate).toISOString(),
    recurrence: doc.recurrence,
    essential: doc.essential,
    priority: doc.priority,
    autopay: doc.autopay,
    fundedAmount: doc.fundedAmount,
    status: doc.status,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}
function toPocket(doc: Doc<"gigPockets">) {
  return {
    id: publicId(doc),
    userId: doc.userId,
    kind: doc.kind,
    currentAmount: doc.currentAmount,
    targetAmount: doc.targetAmount,
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}
function toRule(doc: Doc<"gigSplitRules">) {
  return {
    id: publicId(doc),
    userId: doc.userId,
    essentialsPct: doc.essentialsPct,
    workCostsPct: doc.workCostsPct,
    emergencyPct: doc.emergencyPct,
    longTermPct: doc.longTermPct,
    flexiblePct: doc.flexiblePct,
    enabled: doc.enabled,
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}
function toPayoutSplit(doc: Doc<"gigPayoutSplits">) {
  return {
    id: publicId(doc),
    userId: doc.userId,
    sourceId: doc.sourceId ?? null,
    sourceName: doc.sourceName,
    amount: doc.amount,
    receivedAt: new Date(doc.receivedAt).toISOString(),
    essentialsAmount: doc.essentialsAmount,
    workCostsAmount: doc.workCostsAmount,
    emergencyAmount: doc.emergencyAmount,
    longTermAmount: doc.longTermAmount,
    flexibleAmount: doc.flexibleAmount,
    note: doc.note ?? null,
    allocationMode: doc.allocationMode ?? "CUSTOM",
    beforeSafeAmount: doc.beforeSafeAmount ?? null,
    afterSafeAmount: doc.afterSafeAmount ?? null,
    beforeProtectedDays: doc.beforeProtectedDays ?? null,
    afterProtectedDays: doc.afterProtectedDays ?? null,
    fundedCommitmentIds: doc.fundedCommitmentIds ?? [],
    recommendationReason: doc.recommendationReason ?? null,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}
function toPreferences(doc: Doc<"gigPreferences">) {
  return {
    userId: doc.userId,
    inAppEnabled: doc.inAppEnabled,
    pushEnabled: doc.pushEnabled,
    smsEnabled: doc.smsEnabled,
    whatsappEnabled: doc.whatsappEnabled,
    alertCategories: doc.alertCategories,
    quietHoursStart: doc.quietHoursStart,
    quietHoursEnd: doc.quietHoursEnd,
    reminderDaysBefore: doc.reminderDaysBefore,
    largerText: doc.largerText,
    higherContrast: doc.higherContrast,
    reducedMotion: doc.reducedMotion,
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}
function toNotificationState(doc: Doc<"gigNotificationStates">) {
  return {
    key: doc.key,
    readAt: iso(doc.readAt),
    dismissedAt: iso(doc.dismissedAt),
    snoozedUntil: iso(doc.snoozedUntil),
  };
}

async function bundleForUser(ctx: ReadCtx, userId: string) {
  const [
    profile,
    sources,
    entries,
    commitments,
    pockets,
    splitRule,
    payoutSplits,
  ] = await Promise.all([
    ctx.db
      .query("gigProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique(),
    ctx.db
      .query("gigIncomeSources")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect(),
    ctx.db
      .query("gigCashEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(500),
    ctx.db
      .query("gigCommitments")
      .withIndex("by_user_due", (q) => q.eq("userId", userId))
      .order("asc")
      .collect(),
    ctx.db
      .query("gigPockets")
      .withIndex("by_user_kind", (q) => q.eq("userId", userId))
      .collect(),
    ctx.db
      .query("gigSplitRules")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique(),
    ctx.db
      .query("gigPayoutSplits")
      .withIndex("by_user_received", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50),
  ]);
  if (!profile || !splitRule) return null;
  return {
    profile: toProfile(profile),
    sources: sources.map(toSource),
    entries: entries.map(toEntry),
    commitments: commitments.map(toCommitment),
    pockets: pockets.map(toPocket),
    splitRule: toRule(splitRule),
    payoutSplits: payoutSplits.map(toPayoutSplit),
  };
}

export const getBundle = query({
  args: { serverKey: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    return await bundleForUser(ctx, args.userId);
  },
});

export const completeOnboarding = mutation({
  args: {
    serverKey: v.string(),
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
    currentCushion: v.number(),
    safetyBuffer: v.number(),
    cushionTargetDays: v.number(),
    sources: v.array(sourceValidator),
    commitments: v.array(commitmentValidator),
    splitRule: splitRuleValidator,
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const user = await findUser(ctx, args.userId);
    if (!user) throw new Error("User not found");
    const now = Date.now();
    const oldDocs = await Promise.all([
      ctx.db
        .query("gigProfiles")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("gigIncomeSources")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("gigCommitments")
        .withIndex("by_user_due", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("gigPockets")
        .withIndex("by_user_kind", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("gigSplitRules")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("gigCashEntries")
        .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("gigPayoutSplits")
        .withIndex("by_user_received", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("gigNotificationStates")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
    ]);
    for (const docs of oldDocs)
      for (const doc of docs) await ctx.db.delete(doc._id);
    await ctx.db.insert("gigProfiles", {
      userId: args.userId,
      preferredName: args.preferredName,
      city: args.city,
      preferredLanguage: args.preferredLanguage,
      workTypes: args.workTypes,
      primaryPriority: args.primaryPriority,
      lowWeekIncome: args.lowWeekIncome,
      typicalWeekIncome: args.typicalWeekIncome,
      goodWeekIncome: args.goodWeekIncome,
      workDaysPerWeek: args.workDaysPerWeek,
      platformDeductionRate: args.platformDeductionRate,
      weeklyWorkCosts: args.weeklyWorkCosts,
      openingBalance: args.openingBalance,
      currentBalance: args.openingBalance,
      safetyBuffer: args.safetyBuffer,
      cushionTargetDays: args.cushionTargetDays,
      createdAt: now,
      updatedAt: now,
    });
    for (const source of args.sources) {
      const connected = source.connectionMode.startsWith("SIMULATED");
      const sourceId = await ctx.db.insert("gigIncomeSources", {
        userId: args.userId,
        ...source,
        status: "ACTIVE",
        ...(connected
          ? {
              consentAt: now,
              consentExpiresAt: now + 90 * 86_400_000,
              lastSyncAt: now,
              dataTypes: source.dataTypes ?? [
                "Settled payouts",
                "Payout dates",
                "Platform deductions",
              ],
              purpose:
                source.purpose ??
                "Build an income forecast and safe-to-spend plan",
              consentFrom: source.consentFrom ?? now - 90 * 86_400_000,
              consentTo: source.consentTo ?? now,
            }
          : {}),
        createdAt: now,
        updatedAt: now,
      });
      if (connected)
        await ctx.db.patch(sourceId, {
          consentReceiptId: `SF-${String(sourceId).slice(-10).toUpperCase()}`,
        });
    }
    for (const commitment of args.commitments)
      await ctx.db.insert("gigCommitments", {
        userId: args.userId,
        ...commitment,
        fundedAmount: 0,
        status: "DUE",
        createdAt: now,
        updatedAt: now,
      });
    const essentialTarget = args.commitments
      .filter((item) => item.essential)
      .reduce((sum, item) => sum + item.amount, 0);
    const pocketRows = [
      { kind: "ESSENTIALS", currentAmount: 0, targetAmount: essentialTarget },
      {
        kind: "WORK_COSTS",
        currentAmount: 0,
        targetAmount: args.weeklyWorkCosts,
      },
      {
        kind: "EMERGENCY_CUSHION",
        currentAmount: Math.min(args.currentCushion, args.openingBalance),
        targetAmount: Math.max(
          args.currentCushion,
          args.safetyBuffer,
          (essentialTarget / 30) * args.cushionTargetDays,
        ),
      },
      {
        kind: "LONG_TERM_SAVINGS",
        currentAmount: 0,
        targetAmount: args.typicalWeekIncome * 4,
      },
      {
        kind: "FLEXIBLE_SPENDING",
        currentAmount: 0,
        targetAmount:
          (args.typicalWeekIncome * args.splitRule.flexiblePct) / 100,
      },
    ];
    for (const pocket of pocketRows)
      await ctx.db.insert("gigPockets", {
        userId: args.userId,
        ...pocket,
        updatedAt: now,
      });
    await ctx.db.insert("gigSplitRules", {
      userId: args.userId,
      ...args.splitRule,
      updatedAt: now,
    });
    const preferences = await ctx.db
      .query("gigPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();
    if (!preferences)
      await ctx.db.insert("gigPreferences", {
        userId: args.userId,
        ...defaultPreferences,
        updatedAt: now,
      });
    await ctx.db.insert("gigOutcomeEvents", {
      userId: args.userId,
      type: "ONBOARDING_COMPLETED",
      createdAt: now,
    });
    await ctx.db.patch(user._id, {
      name: args.preferredName,
      onboarded: true,
      updatedAt: now,
    });
    return await bundleForUser(ctx, args.userId);
  },
});

async function profileForUser(ctx: MutationCtx, userId: string) {
  const profile = await ctx.db
    .query("gigProfiles")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .unique();
  if (!profile) throw new Error("Complete onboarding first");
  return profile;
}
const balanceDelta = (kind: string, amount: number, status: string) =>
  !["SETTLED", "PAID"].includes(status)
    ? 0
    : kind === "INCOME"
      ? amount
      : [
            "WORK_EXPENSE",
            "ESSENTIAL_EXPENSE",
            "FLEXIBLE_EXPENSE",
            "COMMITMENT_PAYMENT",
          ].includes(kind)
        ? -amount
        : 0;
const pocketForKind = (kind: string) =>
  kind === "WORK_EXPENSE"
    ? "WORK_COSTS"
    : ["ESSENTIAL_EXPENSE", "COMMITMENT_PAYMENT"].includes(kind)
      ? "ESSENTIALS"
      : kind === "FLEXIBLE_EXPENSE"
        ? "FLEXIBLE_SPENDING"
        : null;
async function adjustPocket(
  ctx: MutationCtx,
  userId: string,
  kind: string,
  amount: number,
) {
  const pocketKind = pocketForKind(kind);
  if (!pocketKind) return 0;
  const pocket = await ctx.db
    .query("gigPockets")
    .withIndex("by_user_kind", (q) =>
      q.eq("userId", userId).eq("kind", pocketKind),
    )
    .unique();
  if (!pocket) return 0;
  const next = Math.max(0, pocket.currentAmount + amount);
  await ctx.db.patch(pocket._id, {
    currentAmount: next,
    updatedAt: Date.now(),
  });
  return next - pocket.currentAmount;
}
async function adjustPocketTarget(
  ctx: MutationCtx,
  userId: string,
  kind: string,
  amount: number,
) {
  const pocket = await ctx.db
    .query("gigPockets")
    .withIndex("by_user_kind", (q) => q.eq("userId", userId).eq("kind", kind))
    .unique();
  if (pocket)
    await ctx.db.patch(pocket._id, {
      targetAmount: Math.max(0, pocket.targetAmount + amount),
      updatedAt: Date.now(),
    });
}
function nextCommitmentDue(dueDate: number, recurrence: string, after: number) {
  const next = new Date(dueDate);
  const advance = () => {
    if (recurrence === "WEEKLY") next.setDate(next.getDate() + 7);
    else if (recurrence === "FORTNIGHTLY") next.setDate(next.getDate() + 14);
    else if (recurrence === "MONTHLY") next.setMonth(next.getMonth() + 1);
    else if (recurrence === "QUARTERLY") next.setMonth(next.getMonth() + 3);
    else if (recurrence === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  };
  do advance();
  while (next.getTime() <= after);
  return next.getTime();
}
function nextSourcePayout(source: Doc<"gigIncomeSources">, after: number) {
  if (!["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY"].includes(source.frequency))
    return null;
  const next = new Date(source.nextPayoutAt ?? after);
  const advance = () => {
    if (source.frequency === "DAILY") next.setDate(next.getDate() + 1);
    else if (source.frequency === "WEEKLY") next.setDate(next.getDate() + 7);
    else if (source.frequency === "FORTNIGHTLY")
      next.setDate(next.getDate() + 14);
    else if (source.frequency === "MONTHLY") next.setMonth(next.getMonth() + 1);
  };
  do advance();
  while (next.getTime() <= after);
  return next.getTime();
}

export const createEntry = mutation({
  args: {
    serverKey: v.string(),
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
    date: v.number(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    if (args.amount <= 0) throw new Error("Amount must be positive");
    const profile = await profileForUser(ctx, args.userId);
    if (args.sourceId) {
      const source = await findSource(ctx, args.sourceId);
      if (!source || source.userId !== args.userId)
        throw new Error("Income source not found");
    }
    const now = Date.now();
    const id = await ctx.db.insert("gigCashEntries", {
      userId: args.userId,
      kind: args.kind,
      amount: args.amount,
      ...(args.sourceId ? { sourceId: args.sourceId } : {}),
      ...(args.sourceName ? { sourceName: args.sourceName } : {}),
      category: args.category,
      paymentMethod: args.paymentMethod,
      ...(args.note ? { note: args.note } : {}),
      workRelated: args.workRelated,
      recurring: args.recurring ?? false,
      status: args.status,
      date: args.date,
      createdAt: now,
      updatedAt: now,
    });
    const delta = balanceDelta(args.kind, args.amount, args.status);
    if (delta) {
      await ctx.db.patch(profile._id, {
        currentBalance: profile.currentBalance + delta,
        updatedAt: now,
      });
      if (delta < 0) {
        const applied = await adjustPocket(ctx, args.userId, args.kind, delta);
        if (applied < 0) await ctx.db.patch(id, { pocketDebit: -applied });
      }
    }
    const entry = await ctx.db.get(id);
    if (!entry) throw new Error("Unable to create entry");
    return toEntry(entry);
  },
});

export const updateEntry = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    id: v.string(),
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
    date: v.number(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    if (args.amount <= 0) throw new Error("Amount must be positive");
    const entry = await findEntry(ctx, args.id);
    if (!entry || entry.userId !== args.userId) return null;
    if (entry.payoutSplitId || entry.commitmentId)
      throw new Error(
        "Linked payout and commitment records are edited from their original flow",
      );
    if (args.sourceId) {
      const source = await findSource(ctx, args.sourceId);
      if (!source || source.userId !== args.userId)
        throw new Error("Income source not found");
    }
    const profile = await profileForUser(ctx, args.userId);
    const now = Date.now();
    const oldDelta = balanceDelta(entry.kind, entry.amount, entry.status);
    if (oldDelta < 0 && entry.pocketDebit)
      await adjustPocket(ctx, args.userId, entry.kind, entry.pocketDebit);
    const newDelta = balanceDelta(args.kind, args.amount, args.status);
    let pocketDebit = 0;
    if (newDelta < 0) {
      const applied = await adjustPocket(ctx, args.userId, args.kind, newDelta);
      pocketDebit = Math.max(0, -applied);
    }
    await ctx.db.patch(profile._id, {
      currentBalance: profile.currentBalance - oldDelta + newDelta,
      updatedAt: now,
    });
    await ctx.db.patch(entry._id, {
      kind: args.kind,
      amount: args.amount,
      sourceId: args.sourceId,
      sourceName: args.sourceName,
      category: args.category,
      paymentMethod: args.paymentMethod,
      note: args.note,
      workRelated: args.workRelated,
      recurring: args.recurring ?? false,
      status: args.status,
      pocketDebit: pocketDebit || undefined,
      date: args.date,
      updatedAt: now,
    });
    const updated = await ctx.db.get(entry._id);
    return updated ? toEntry(updated) : null;
  },
});

export const deleteEntry = mutation({
  args: { serverKey: v.string(), userId: v.string(), id: v.string() },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const entry = await findEntry(ctx, args.id);
    if (!entry || entry.userId !== args.userId) return false;
    if (entry.payoutSplitId)
      throw new Error("Payout records cannot be deleted from the cashbook");
    const profile = await profileForUser(ctx, args.userId);
    const delta = balanceDelta(entry.kind, entry.amount, entry.status);
    if (entry.commitmentId) {
      const commitment = await findCommitment(ctx, entry.commitmentId);
      if (!commitment || commitment.userId !== args.userId)
        throw new Error("Linked commitment not found");
      await ctx.db.patch(commitment._id, {
        status: "DUE",
        fundedAmount: 0,
        ...(entry.commitmentDueDate
          ? { dueDate: entry.commitmentDueDate }
          : {}),
        updatedAt: Date.now(),
      });
      if (
        commitment.essential &&
        commitment.recurrence === "ONE_TIME" &&
        commitment.status === "PAID"
      )
        await adjustPocketTarget(
          ctx,
          args.userId,
          "ESSENTIALS",
          commitment.amount,
        );
    }
    await ctx.db.delete(entry._id);
    if (delta) {
      await ctx.db.patch(profile._id, {
        currentBalance: profile.currentBalance - delta,
        updatedAt: Date.now(),
      });
      if (delta < 0 && entry.pocketDebit)
        await adjustPocket(ctx, args.userId, entry.kind, entry.pocketDebit);
    }
    return true;
  },
});

export const createSource = mutation({
  args: { serverKey: v.string(), userId: v.string(), source: sourceValidator },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    await profileForUser(ctx, args.userId);
    const now = Date.now();
    const connected = args.source.connectionMode.startsWith("SIMULATED");
    const id = await ctx.db.insert("gigIncomeSources", {
      userId: args.userId,
      ...args.source,
      status: "ACTIVE",
      ...(connected
        ? {
            consentAt: now,
            consentExpiresAt: now + 90 * 86_400_000,
            lastSyncAt: now,
            dataTypes: args.source.dataTypes ?? [
              "Settled payouts",
              "Payout dates",
              "Platform deductions",
            ],
            purpose:
              args.source.purpose ??
              "Build an income forecast and safe-to-spend plan",
            consentFrom: args.source.consentFrom ?? now - 90 * 86_400_000,
            consentTo: args.source.consentTo ?? now,
          }
        : {}),
      createdAt: now,
      updatedAt: now,
    });
    if (connected)
      await ctx.db.patch(id, {
        consentReceiptId: `SF-${String(id).slice(-10).toUpperCase()}`,
      });
    const source = await ctx.db.get(id);
    if (!source) throw new Error("Unable to create source");
    return toSource(source);
  },
});

export const refreshSource = mutation({
  args: { serverKey: v.string(), userId: v.string(), id: v.string() },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const source = await findSource(ctx, args.id);
    if (!source || source.userId !== args.userId) return null;
    if (source.status === "REVOKED")
      throw new Error("Reconnect the source before refreshing");
    const now = Date.now();
    const patch = { status: "ACTIVE", lastSyncAt: now, updatedAt: now };
    await ctx.db.patch(source._id, patch);
    return toSource({ ...source, ...patch });
  },
});

export const updateSourceStatus = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    id: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const source = await findSource(ctx, args.id);
    if (!source || source.userId !== args.userId) return null;
    const now = Date.now();
    const patch = {
      status: args.status,
      ...(args.status === "REVOKED" ? { consentExpiresAt: now } : {}),
      updatedAt: now,
    };
    await ctx.db.patch(source._id, patch);
    return toSource({ ...source, ...patch });
  },
});

export const createCommitment = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    commitment: commitmentValidator,
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    await profileForUser(ctx, args.userId);
    const now = Date.now();
    const id = await ctx.db.insert("gigCommitments", {
      userId: args.userId,
      ...args.commitment,
      fundedAmount: 0,
      status: "DUE",
      createdAt: now,
      updatedAt: now,
    });
    if (args.commitment.essential)
      await adjustPocketTarget(
        ctx,
        args.userId,
        "ESSENTIALS",
        args.commitment.amount,
      );
    const commitment = await ctx.db.get(id);
    if (!commitment) throw new Error("Unable to create commitment");
    return toCommitment(commitment);
  },
});

export const updateCommitment = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    id: v.string(),
    dueDate: v.optional(v.number()),
    amount: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const commitment = await findCommitment(ctx, args.id);
    if (!commitment || commitment.userId !== args.userId) return null;
    const now = Date.now();
    const patch = {
      ...(args.dueDate !== undefined ? { dueDate: args.dueDate } : {}),
      ...(args.amount !== undefined ? { amount: args.amount } : {}),
      ...(args.status !== undefined ? { status: args.status } : {}),
      updatedAt: now,
    };
    await ctx.db.patch(commitment._id, patch);
    if (
      commitment.essential &&
      args.amount !== undefined &&
      !(commitment.recurrence === "ONE_TIME" && commitment.status === "PAID")
    )
      await adjustPocketTarget(
        ctx,
        args.userId,
        "ESSENTIALS",
        args.amount - commitment.amount,
      );
    return toCommitment({ ...commitment, ...patch });
  },
});

export const markCommitmentPaid = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    id: v.string(),
    paidAt: v.number(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const commitment = await findCommitment(ctx, args.id);
    if (!commitment || commitment.userId !== args.userId) return null;
    if (commitment.status === "PAID") return toCommitment(commitment);
    const profile = await profileForUser(ctx, args.userId);
    const now = Date.now();
    const recurring = commitment.recurrence !== "ONE_TIME";
    const nextState = {
      status: recurring ? "DUE" : "PAID",
      fundedAmount: recurring ? 0 : commitment.amount,
      ...(recurring
        ? {
            dueDate: nextCommitmentDue(
              commitment.dueDate,
              commitment.recurrence,
              args.paidAt,
            ),
          }
        : {}),
      updatedAt: now,
    };
    await ctx.db.patch(commitment._id, nextState);
    if (!recurring && commitment.essential)
      await adjustPocketTarget(
        ctx,
        args.userId,
        "ESSENTIALS",
        -commitment.amount,
      );
    await ctx.db.patch(profile._id, {
      currentBalance: profile.currentBalance - commitment.amount,
      updatedAt: now,
    });
    const applied = await adjustPocket(
      ctx,
      args.userId,
      "COMMITMENT_PAYMENT",
      -commitment.amount,
    );
    await ctx.db.insert("gigCashEntries", {
      userId: args.userId,
      kind: "COMMITMENT_PAYMENT",
      amount: commitment.amount,
      category: commitment.category,
      paymentMethod: commitment.autopay ? "AUTOPAY" : "MANUAL",
      note: `Paid ${commitment.title}`,
      workRelated: false,
      status: "PAID",
      commitmentId: String(commitment._id),
      commitmentDueDate: commitment.dueDate,
      ...(applied < 0 ? { pocketDebit: -applied } : {}),
      date: args.paidAt,
      createdAt: now,
    });
    return toCommitment({ ...commitment, ...nextState });
  },
});

export const deleteCommitment = mutation({
  args: { serverKey: v.string(), userId: v.string(), id: v.string() },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const commitment = await findCommitment(ctx, args.id);
    if (!commitment || commitment.userId !== args.userId) return false;
    const entries = await ctx.db
      .query("gigCashEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();
    for (const entry of entries)
      if (entry.commitmentId === String(commitment._id))
        await ctx.db.patch(entry._id, {
          commitmentId: undefined,
          commitmentDueDate: undefined,
        });
    if (
      commitment.essential &&
      !(commitment.recurrence === "ONE_TIME" && commitment.status === "PAID")
    )
      await adjustPocketTarget(
        ctx,
        args.userId,
        "ESSENTIALS",
        -commitment.amount,
      );
    await ctx.db.delete(commitment._id);
    return true;
  },
});

const roundMoney = (value: number) => Math.round(value * 100) / 100;
async function addToPocket(
  ctx: MutationCtx,
  userId: string,
  kind: string,
  amount: number,
) {
  const pocket = await ctx.db
    .query("gigPockets")
    .withIndex("by_user_kind", (q) => q.eq("userId", userId).eq("kind", kind))
    .unique();
  if (!pocket) throw new Error(`Missing ${kind} pocket`);
  await ctx.db.patch(pocket._id, {
    currentAmount: pocket.currentAmount + amount,
    updatedAt: Date.now(),
  });
}

export const applyPayoutSplit = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    sourceId: v.optional(v.string()),
    sourceName: v.string(),
    amount: v.number(),
    receivedAt: v.number(),
    note: v.optional(v.string()),
    allocationMode: v.optional(v.string()),
    beforeSafeAmount: v.optional(v.number()),
    afterSafeAmount: v.optional(v.number()),
    beforeProtectedDays: v.optional(v.number()),
    afterProtectedDays: v.optional(v.number()),
    fundedCommitmentIds: v.optional(v.array(v.string())),
    recommendationReason: v.optional(v.string()),
    percentages: v.object({
      essentialsPct: v.number(),
      workCostsPct: v.number(),
      emergencyPct: v.number(),
      longTermPct: v.number(),
      flexiblePct: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    if (args.amount <= 0) throw new Error("Amount must be positive");
    const totalPct = Object.values(args.percentages).reduce(
      (sum, value) => sum + value,
      0,
    );
    if (Math.abs(totalPct - 100) > 0.001)
      throw new Error("Smart Split must total 100%");
    let linkedSource: Doc<"gigIncomeSources"> | null = null;
    if (args.sourceId) {
      const source = await findSource(ctx, args.sourceId);
      if (!source || source.userId !== args.userId)
        throw new Error("Income source not found");
      if (source.status !== "ACTIVE")
        throw new Error("Income source is not active");
      linkedSource = source;
    }
    const profile = await profileForUser(ctx, args.userId);
    const now = Date.now();
    const essentialsAmount = roundMoney(
      (args.amount * args.percentages.essentialsPct) / 100,
    );
    const workCostsAmount = roundMoney(
      (args.amount * args.percentages.workCostsPct) / 100,
    );
    const emergencyAmount = roundMoney(
      (args.amount * args.percentages.emergencyPct) / 100,
    );
    const longTermAmount = roundMoney(
      (args.amount * args.percentages.longTermPct) / 100,
    );
    const flexibleAmount = roundMoney(
      args.amount -
        essentialsAmount -
        workCostsAmount -
        emergencyAmount -
        longTermAmount,
    );
    const requestedCommitmentIds = new Set(args.fundedCommitmentIds ?? []);
    const fundedCommitments: Array<{
      doc: Doc<"gigCommitments">;
      amount: number;
    }> = [];
    let remainingEssentialFunding = essentialsAmount;
    if (requestedCommitmentIds.size > 0 && remainingEssentialFunding > 0) {
      const commitments = await ctx.db
        .query("gigCommitments")
        .withIndex("by_user_due", (q) => q.eq("userId", args.userId))
        .collect();
      for (const commitment of commitments
        .filter(
          (item) =>
            requestedCommitmentIds.has(String(item._id)) &&
            item.essential &&
            item.status !== "PAID",
        )
        .sort((a, b) => a.priority - b.priority || a.dueDate - b.dueDate)) {
        if (remainingEssentialFunding <= 0) break;
        const amount = roundMoney(
          Math.min(
            remainingEssentialFunding,
            Math.max(0, commitment.amount - commitment.fundedAmount),
          ),
        );
        if (amount <= 0) continue;
        fundedCommitments.push({ doc: commitment, amount });
        remainingEssentialFunding = roundMoney(
          remainingEssentialFunding - amount,
        );
      }
    }
    const fundedCommitmentIds = fundedCommitments.map(({ doc }) =>
      String(doc._id),
    );
    const splitId = await ctx.db.insert("gigPayoutSplits", {
      userId: args.userId,
      ...(args.sourceId ? { sourceId: args.sourceId } : {}),
      sourceName: args.sourceName,
      amount: args.amount,
      receivedAt: args.receivedAt,
      essentialsAmount,
      workCostsAmount,
      emergencyAmount,
      longTermAmount,
      flexibleAmount,
      ...(args.note ? { note: args.note } : {}),
      ...(args.allocationMode ? { allocationMode: args.allocationMode } : {}),
      ...(args.beforeSafeAmount !== undefined
        ? { beforeSafeAmount: args.beforeSafeAmount }
        : {}),
      ...(args.afterSafeAmount !== undefined
        ? { afterSafeAmount: args.afterSafeAmount }
        : {}),
      ...(args.beforeProtectedDays !== undefined
        ? { beforeProtectedDays: args.beforeProtectedDays }
        : {}),
      ...(args.afterProtectedDays !== undefined
        ? { afterProtectedDays: args.afterProtectedDays }
        : {}),
      ...(fundedCommitmentIds.length ? { fundedCommitmentIds } : {}),
      ...(args.recommendationReason
        ? { recommendationReason: args.recommendationReason }
        : {}),
      createdAt: now,
    });
    await ctx.db.insert("gigCashEntries", {
      userId: args.userId,
      kind: "INCOME",
      amount: args.amount,
      ...(args.sourceId ? { sourceId: args.sourceId } : {}),
      sourceName: args.sourceName,
      category: "Payout",
      paymentMethod: "PLATFORM",
      ...(args.note ? { note: args.note } : {}),
      workRelated: false,
      status: "SETTLED",
      payoutSplitId: String(splitId),
      date: args.receivedAt,
      createdAt: now,
    });
    await ctx.db.patch(profile._id, {
      currentBalance: profile.currentBalance + args.amount,
      updatedAt: now,
    });
    if (linkedSource) {
      const nextPayoutAt = nextSourcePayout(linkedSource, args.receivedAt);
      await ctx.db.patch(linkedSource._id, {
        lastSyncAt: now,
        ...(nextPayoutAt ? { nextPayoutAt } : {}),
        updatedAt: now,
      });
    }
    await addToPocket(ctx, args.userId, "ESSENTIALS", essentialsAmount);
    await addToPocket(ctx, args.userId, "WORK_COSTS", workCostsAmount);
    await addToPocket(ctx, args.userId, "EMERGENCY_CUSHION", emergencyAmount);
    await addToPocket(ctx, args.userId, "LONG_TERM_SAVINGS", longTermAmount);
    await addToPocket(ctx, args.userId, "FLEXIBLE_SPENDING", flexibleAmount);
    for (const { doc, amount } of fundedCommitments)
      await ctx.db.patch(doc._id, {
        fundedAmount: roundMoney(doc.fundedAmount + amount),
        updatedAt: now,
      });
    const split = await ctx.db.get(splitId);
    if (!split) throw new Error("Unable to save payout split");
    return toPayoutSplit(split);
  },
});

export const updateSettings = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    preferredName: v.optional(v.string()),
    city: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    safetyBuffer: v.optional(v.number()),
    cushionTargetDays: v.optional(v.number()),
    splitRule: v.optional(splitRuleValidator),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const profile = await profileForUser(ctx, args.userId);
    const now = Date.now();
    const profilePatch = {
      ...(args.preferredName !== undefined
        ? { preferredName: args.preferredName }
        : {}),
      ...(args.city !== undefined ? { city: args.city } : {}),
      ...(args.preferredLanguage !== undefined
        ? { preferredLanguage: args.preferredLanguage }
        : {}),
      ...(args.safetyBuffer !== undefined
        ? { safetyBuffer: args.safetyBuffer }
        : {}),
      ...(args.cushionTargetDays !== undefined
        ? { cushionTargetDays: args.cushionTargetDays }
        : {}),
      updatedAt: now,
    };
    await ctx.db.patch(profile._id, profilePatch);
    if (args.splitRule) {
      const rule = await ctx.db
        .query("gigSplitRules")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .unique();
      if (!rule) throw new Error("Split rule not found");
      await ctx.db.patch(rule._id, { ...args.splitRule, updatedAt: now });
    }
    return await bundleForUser(ctx, args.userId);
  },
});

export const getPreferences = query({
  args: { serverKey: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const preferences = await ctx.db
      .query("gigPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();
    return preferences
      ? toPreferences(preferences)
      : {
          userId: args.userId,
          ...defaultPreferences,
          updatedAt: new Date(0).toISOString(),
        };
  },
});

export const updatePreferences = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    preferences: preferencesValidator,
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    await profileForUser(ctx, args.userId);
    const existing = await ctx.db
      .query("gigPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();
    const updatedAt = Date.now();
    if (existing)
      await ctx.db.patch(existing._id, { ...args.preferences, updatedAt });
    else
      await ctx.db.insert("gigPreferences", {
        userId: args.userId,
        ...args.preferences,
        updatedAt,
      });
    return {
      userId: args.userId,
      ...args.preferences,
      updatedAt: new Date(updatedAt).toISOString(),
    };
  },
});

export const getNotificationStates = query({
  args: { serverKey: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const states = await ctx.db
      .query("gigNotificationStates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return states.map(toNotificationState);
  },
});

export const updateNotificationState = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    key: v.string(),
    action: v.string(),
    snoozedUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const existing = await ctx.db
      .query("gigNotificationStates")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", args.userId).eq("key", args.key),
      )
      .unique();
    const now = Date.now();
    const patch =
      args.action === "READ"
        ? { readAt: now, updatedAt: now }
        : args.action === "UNREAD"
          ? { readAt: undefined, updatedAt: now }
          : args.action === "DISMISS"
            ? { readAt: now, dismissedAt: now, updatedAt: now }
            : {
                readAt: now,
                snoozedUntil: args.snoozedUntil ?? now + 86_400_000,
                updatedAt: now,
              };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      const updated = await ctx.db.get(existing._id);
      return updated ? toNotificationState(updated) : null;
    }
    const id = await ctx.db.insert("gigNotificationStates", {
      userId: args.userId,
      key: args.key,
      ...patch,
    });
    const created = await ctx.db.get(id);
    return created ? toNotificationState(created) : null;
  },
});

export const recordOutcome = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    type: v.string(),
    value: v.optional(v.number()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    await profileForUser(ctx, args.userId);
    const createdAt = Date.now();
    return await ctx.db.insert("gigOutcomeEvents", {
      userId: args.userId,
      type: args.type,
      ...(args.value !== undefined ? { value: args.value } : {}),
      ...(args.metadata ? { metadata: args.metadata } : {}),
      createdAt,
    });
  },
});

export const getPartnerMetrics = query({
  args: {
    serverKey: v.string(),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
    city: v.optional(v.string()),
    workType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const now = Date.now();
    const from = args.from ?? now - 30 * 86_400_000;
    const to = args.to ?? now;
    const allProfiles = await ctx.db.query("gigProfiles").collect();
    const profiles = allProfiles.filter(
      (profile) =>
        (!args.city || profile.city === args.city) &&
        (!args.workType || profile.workTypes.includes(args.workType)),
    );
    const userIds = new Set(profiles.map((profile) => profile.userId));
    const [
      allSources,
      allEntries,
      allCommitments,
      allPockets,
      allSplits,
      allEvents,
    ] = await Promise.all([
      ctx.db.query("gigIncomeSources").collect(),
      ctx.db.query("gigCashEntries").collect(),
      ctx.db.query("gigCommitments").collect(),
      ctx.db.query("gigPockets").collect(),
      ctx.db.query("gigPayoutSplits").collect(),
      ctx.db.query("gigOutcomeEvents").collect(),
    ]);
    const sources = allSources.filter((item) => userIds.has(item.userId));
    const entries = allEntries.filter(
      (item) =>
        userIds.has(item.userId) && item.date >= from && item.date <= to,
    );
    const commitments = allCommitments.filter((item) =>
      userIds.has(item.userId),
    );
    const pockets = allPockets.filter((item) => userIds.has(item.userId));
    const splits = allSplits.filter(
      (item) =>
        userIds.has(item.userId) &&
        item.receivedAt >= from &&
        item.receivedAt <= to,
    );
    const events = allEvents.filter(
      (item) =>
        userIds.has(item.userId) &&
        item.createdAt >= from &&
        item.createdAt <= to,
    );
    const recurrenceMonthly = (item: Doc<"gigCommitments">) =>
      item.recurrence === "WEEKLY"
        ? item.amount * 4.345
        : item.recurrence === "FORTNIGHTLY"
          ? item.amount * 2.1725
          : item.recurrence === "QUARTERLY"
            ? item.amount / 3
            : item.recurrence === "YEARLY"
              ? item.amount / 12
              : item.recurrence === "ONE_TIME"
                ? item.amount
                : item.amount;
    const protectedDays = profiles.map((profile) => {
      const cushion =
        pockets.find(
          (item) =>
            item.userId === profile.userId && item.kind === "EMERGENCY_CUSHION",
        )?.currentAmount ?? 0;
      const monthlyEssentials = commitments
        .filter(
          (item) =>
            item.userId === profile.userId &&
            item.essential &&
            item.status !== "PAID",
        )
        .reduce((sum, item) => sum + recurrenceMonthly(item), 0);
      return (
        cushion /
        Math.max(1, monthlyEssentials / 30.44 + profile.weeklyWorkCosts / 7)
      );
    });
    const covered = profiles.filter((profile) => {
      const essentialPocket =
        pockets.find(
          (item) =>
            item.userId === profile.userId && item.kind === "ESSENTIALS",
        )?.currentAmount ?? 0;
      const due = commitments
        .filter(
          (item) =>
            item.userId === profile.userId &&
            item.essential &&
            item.status !== "PAID",
        )
        .reduce(
          (sum, item) => sum + Math.max(0, item.amount - item.fundedAmount),
          0,
        );
      return essentialPocket >= due;
    }).length;
    const predictedShortfalls = profiles.filter(
      (profile) =>
        profile.currentBalance < profile.safetyBuffer ||
        commitments
          .filter(
            (item) =>
              item.userId === profile.userId &&
              item.essential &&
              item.status !== "PAID",
          )
          .reduce(
            (sum, item) => sum + Math.max(0, item.amount - item.fundedAmount),
            0,
          ) > profile.currentBalance,
    ).length;
    const activeSources = sources.filter((item) => item.status === "ACTIVE");
    const consented = activeSources.filter(
      (item) =>
        item.connectionMode.startsWith("SIMULATED") &&
        item.consentAt &&
        (!item.consentExpiresAt || item.consentExpiresAt > now),
    );
    const gross = entries
      .filter((item) => item.kind === "INCOME" && item.status === "SETTLED")
      .reduce((sum, item) => sum + item.amount, 0);
    const workCosts = entries
      .filter((item) => item.kind === "WORK_EXPENSE" && item.status === "PAID")
      .reduce((sum, item) => sum + item.amount, 0);
    const linkedSplits = splits.filter((split) => split.sourceId);
    const accurateSplits = linkedSplits.filter((split) => {
      const source = sources.find(
        (item) => String(item._id) === split.sourceId,
      );
      return (
        source &&
        split.amount >= source.typicalMin &&
        split.amount <= source.typicalMax
      );
    });
    const weeklyActiveUsers = new Set(
      entries
        .filter((item) => item.date >= now - 7 * 86_400_000)
        .map((item) => item.userId),
    ).size;
    const safeChecks = events.filter(
      (item) => item.type === "SAFE_TO_SPEND_CHECKED",
    ).length;
    const weekMs = 7 * 86_400_000;
    const trends = Array.from({ length: 6 }, (_, index) => {
      const start = to - (5 - index) * weekMs - weekMs;
      const end = start + weekMs;
      const rows = entries.filter(
        (item) => item.date >= start && item.date < end,
      );
      const weeklyGross = rows
        .filter((item) => item.kind === "INCOME" && item.status === "SETTLED")
        .reduce((sum, item) => sum + item.amount, 0);
      const weeklyCosts = rows
        .filter(
          (item) => item.kind === "WORK_EXPENSE" && item.status === "PAID",
        )
        .reduce((sum, item) => sum + item.amount, 0);
      return {
        week: new Date(start).toISOString(),
        grossIncome: weeklyGross,
        trueNetIncome: weeklyGross - weeklyCosts,
        workCosts: weeklyCosts,
        payoutsAllocated: splits.filter(
          (item) => item.receivedAt >= start && item.receivedAt < end,
        ).length,
      };
    });
    const byCity = [...new Set(allProfiles.map((item) => item.city))].sort();
    const byWorkType = [
      ...new Set(allProfiles.flatMap((item) => item.workTypes)),
    ].sort();
    return {
      range: {
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
      },
      filters: { cities: byCity, workTypes: byWorkType },
      metrics: {
        activeWorkers: profiles.length,
        weeklyActiveUsers,
        connectedIncomeSources: activeSources.length,
        commitmentCoveragePct: profiles.length
          ? Math.round((covered / profiles.length) * 1000) / 10
          : 0,
        averageProtectedDays: protectedDays.length
          ? Math.round(
              (protectedDays.reduce((sum, value) => sum + value, 0) /
                protectedDays.length) *
                10,
            ) / 10
          : 0,
        predictedShortfalls,
        shortfallsResolvedWithoutCredit: events.filter(
          (item) => item.type === "SHORTFALL_RESOLVED_WITHOUT_CREDIT",
        ).length,
        creditAvoided: events.filter((item) => item.type === "CREDIT_AVOIDED")
          .length,
        workCostRatioPct: gross
          ? Math.round((workCosts / gross) * 1000) / 10
          : 0,
        consentCoveragePct: activeSources.length
          ? Math.round((consented.length / activeSources.length) * 1000) / 10
          : 0,
        payoutsAllocated: splits.length,
        payoutValue: splits.reduce((sum, item) => sum + item.amount, 0),
        safeChecksPerWorker: profiles.length
          ? Math.round((safeChecks / profiles.length) * 10) / 10
          : 0,
        forecastAccuracyPct: linkedSplits.length
          ? Math.round((accurateSplits.length / linkedSplits.length) * 1000) /
            10
          : null,
        recommendedActionsCompleted: events.filter(
          (item) => item.type === "RECOMMENDED_ACTION_COMPLETED",
        ).length,
        dataFreshnessAt: new Date(
          Math.max(
            0,
            ...profiles.map((item) => item.updatedAt),
            ...sources.map((item) => item.updatedAt),
            ...entries.map((item) => item.createdAt),
          ),
        ).toISOString(),
      },
      trends,
      policy: {
        aggregationOnly: true,
        minimumCohortSize: 1,
        workerLevelSurveillance: false,
        punitiveScoring: false,
        creditPromotionNotifications: false,
      },
    };
  },
});
