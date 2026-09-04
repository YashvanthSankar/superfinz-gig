import { v } from "convex/values";
import { mutation, type MutationCtx } from "./_generated/server";

function assertServerKey(serverKey: string) {
  const configured = process.env.SUPERFINZ_SERVER_KEY;
  if (!configured || serverKey !== configured) throw new Error("Unauthorized server request");
}

async function clearTable(
  ctx: MutationCtx,
  table: "users" | "profiles" | "transactions" | "budgets" | "goals",
) {
  const documents = await ctx.db.query(table).collect();
  for (const document of documents) await ctx.db.delete(document._id);
}

const userType = v.union(
  v.literal("SCHOOL_STUDENT"),
  v.literal("COLLEGE_STUDENT"),
  v.literal("PROFESSIONAL"),
);

export const importUsers = mutation({
  args: {
    serverKey: v.string(),
    replace: v.boolean(),
    records: v.array(v.object({
      externalId: v.string(),
      email: v.string(),
      googleId: v.optional(v.string()),
      avatar: v.optional(v.string()),
      name: v.string(),
      age: v.number(),
      userType,
      onboarded: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    if (args.replace) await clearTable(ctx, "users");
    for (const record of args.records) await ctx.db.insert("users", record);
    return args.records.length;
  },
});

export const importProfiles = mutation({
  args: {
    serverKey: v.string(),
    replace: v.boolean(),
    records: v.array(v.object({
      externalId: v.string(),
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
    })),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    if (args.replace) await clearTable(ctx, "profiles");
    for (const record of args.records) await ctx.db.insert("profiles", record);
    return args.records.length;
  },
});

export const importTransactions = mutation({
  args: {
    serverKey: v.string(),
    replace: v.boolean(),
    records: v.array(v.object({
      externalId: v.string(),
      userId: v.string(),
      amount: v.number(),
      category: v.string(),
      description: v.string(),
      isNecessary: v.optional(v.boolean()),
      aiNote: v.optional(v.string()),
      date: v.number(),
      createdAt: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    if (args.replace) await clearTable(ctx, "transactions");
    for (const record of args.records) await ctx.db.insert("transactions", record);
    return args.records.length;
  },
});

export const importBudgets = mutation({
  args: {
    serverKey: v.string(),
    replace: v.boolean(),
    records: v.array(v.object({
      externalId: v.string(),
      userId: v.string(),
      category: v.string(),
      limit: v.number(),
      month: v.number(),
      year: v.number(),
      spent: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    if (args.replace) await clearTable(ctx, "budgets");
    for (const record of args.records) await ctx.db.insert("budgets", record);
    return args.records.length;
  },
});

export const importGoals = mutation({
  args: {
    serverKey: v.string(),
    replace: v.boolean(),
    records: v.array(v.object({
      externalId: v.string(),
      userId: v.string(),
      title: v.string(),
      targetAmount: v.number(),
      savedAmount: v.number(),
      deadline: v.optional(v.number()),
      achieved: v.boolean(),
      isEssential: v.boolean(),
      createdAt: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    if (args.replace) await clearTable(ctx, "goals");
    for (const record of args.records) await ctx.db.insert("goals", record);
    return args.records.length;
  },
});

/** Server-only repair for a payout date affected by an earlier schedule bug. */
export const repairGigSourceNextPayout = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    sourceId: v.id("gigIncomeSources"),
    nextPayoutAt: v.number(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.userId !== args.userId)
      throw new Error("Income source not found");
    const updatedAt = Date.now();
    await ctx.db.patch(source._id, {
      nextPayoutAt: args.nextPayoutAt,
      updatedAt,
    });
    return { sourceId: source._id, nextPayoutAt: args.nextPayoutAt, updatedAt };
  },
});

/**
 * Clears application data for known users while preserving their Google
 * identities, so the next sign-in starts onboarding from the beginning.
 */
export const resetUsersForOnboarding = mutation({
  args: {
    serverKey: v.string(),
    emails: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const results: Array<{ email: string; found: boolean; deleted: number }> = [];

    for (const rawEmail of new Set(args.emails.map((email) => email.toLowerCase()))) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", rawEmail))
        .unique();
      if (!user) {
        results.push({ email: rawEmail, found: false, deleted: 0 });
        continue;
      }

      const userId = user._id;
      const collections = await Promise.all([
        ctx.db.query("profiles").withIndex("by_user_id", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("mobileSessions").withIndex("by_user_id", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("transactions").withIndex("by_user_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("budgets").withIndex("by_user_period", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("goals").withIndex("by_user_created", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("gigProfiles").withIndex("by_user_id", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("gigIncomeSources").withIndex("by_user_id", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("gigCashEntries").withIndex("by_user_date", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("gigCommitments").withIndex("by_user_due", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("gigPockets").withIndex("by_user_kind", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("gigSplitRules").withIndex("by_user_id", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("gigPayoutSplits").withIndex("by_user_received", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("gigPreferences").withIndex("by_user_id", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("gigNotificationStates").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("gigOutcomeEvents").withIndex("by_user_created", (q) => q.eq("userId", userId)).collect(),
      ]);
      let deleted = 0;
      for (const documents of collections) {
        for (const document of documents) {
          await ctx.db.delete(document._id);
          deleted += 1;
        }
      }
      await ctx.db.patch(user._id, { onboarded: false, updatedAt: Date.now() });
      results.push({ email: rawEmail, found: true, deleted });
    }

    return results;
  },
});
