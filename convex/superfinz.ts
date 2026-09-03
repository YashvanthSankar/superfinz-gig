import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

type ReadCtx = QueryCtx | MutationCtx;

function assertServerKey(serverKey: string) {
  const configured = process.env.SUPERFINZ_SERVER_KEY;
  if (!configured || serverKey !== configured) {
    throw new Error("Unauthorized server request");
  }
}

function publicId(document: { _id: string; externalId?: string }) {
  return document.externalId ?? document._id;
}

function toProfile(profile: Doc<"profiles">) {
  return {
    id: publicId(profile),
    userId: profile.userId,
    institution: profile.institution ?? null,
    monthlyAllowance: profile.monthlyAllowance ?? null,
    incomeSources: profile.incomeSources,
    company: profile.company ?? null,
    monthlySalary: profile.monthlySalary ?? null,
    industry: profile.industry ?? null,
    monthlyBudget: profile.monthlyBudget,
    savingsGoal: profile.savingsGoal,
    currency: profile.currency,
    spendingPattern: profile.spendingPattern,
    cycleStartDate: profile.cycleStartDate,
    createdAt: new Date(profile.createdAt).toISOString(),
    updatedAt: new Date(profile.updatedAt).toISOString(),
  };
}

function toTransaction(transaction: Doc<"transactions">) {
  return {
    id: publicId(transaction),
    userId: transaction.userId,
    amount: transaction.amount,
    category: transaction.category,
    description: transaction.description,
    isNecessary: transaction.isNecessary ?? null,
    aiNote: transaction.aiNote ?? null,
    date: new Date(transaction.date).toISOString(),
    createdAt: new Date(transaction.createdAt).toISOString(),
  };
}

function toBudget(budget: Doc<"budgets">) {
  return {
    id: publicId(budget),
    userId: budget.userId,
    category: budget.category,
    limit: budget.limit,
    month: budget.month,
    year: budget.year,
    spent: budget.spent,
  };
}

function toGoal(goal: Doc<"goals">) {
  return {
    id: publicId(goal),
    userId: goal.userId,
    title: goal.title,
    targetAmount: goal.targetAmount,
    savedAmount: goal.savedAmount,
    deadline: goal.deadline === undefined ? null : new Date(goal.deadline).toISOString(),
    achieved: goal.achieved,
    isEssential: goal.isEssential,
    createdAt: new Date(goal.createdAt).toISOString(),
  };
}

async function findUserById(ctx: ReadCtx, id: string) {
  const nativeId = ctx.db.normalizeId("users", id);
  if (nativeId) {
    const nativeUser = await ctx.db.get(nativeId);
    if (nativeUser) return nativeUser;
  }
  return await ctx.db
    .query("users")
    .withIndex("by_external_id", (q) => q.eq("externalId", id))
    .unique();
}

async function findUserByEmail(ctx: ReadCtx, email: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
    .unique();
}

async function findProfile(ctx: ReadCtx, userId: string) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .unique();
}

async function toUser(ctx: ReadCtx, user: Doc<"users">) {
  const id = publicId(user);
  const profile = await findProfile(ctx, id);
  return {
    id,
    email: user.email,
    googleId: user.googleId ?? null,
    avatar: user.avatar ?? null,
    name: user.name,
    age: user.age,
    userType: user.userType,
    onboarded: user.onboarded,
    createdAt: new Date(user.createdAt).toISOString(),
    updatedAt: new Date(user.updatedAt).toISOString(),
    profile: profile ? toProfile(profile) : null,
  };
}

async function findSessionById(ctx: ReadCtx, id: string) {
  const nativeId = ctx.db.normalizeId("mobileSessions", id);
  if (nativeId) {
    const nativeSession = await ctx.db.get(nativeId);
    if (nativeSession) return nativeSession;
  }
  return await ctx.db
    .query("mobileSessions")
    .withIndex("by_external_id", (q) => q.eq("externalId", id))
    .unique();
}

async function findTransactionById(ctx: ReadCtx, id: string) {
  const nativeId = ctx.db.normalizeId("transactions", id);
  if (nativeId) {
    const nativeTransaction = await ctx.db.get(nativeId);
    if (nativeTransaction) return nativeTransaction;
  }
  return await ctx.db
    .query("transactions")
    .withIndex("by_external_id", (q) => q.eq("externalId", id))
    .unique();
}

async function findGoalById(ctx: ReadCtx, id: string) {
  const nativeId = ctx.db.normalizeId("goals", id);
  if (nativeId) {
    const nativeGoal = await ctx.db.get(nativeId);
    if (nativeGoal) return nativeGoal;
  }
  return await ctx.db
    .query("goals")
    .withIndex("by_external_id", (q) => q.eq("externalId", id))
    .unique();
}

export const health = query({
  args: { serverKey: v.string() },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const [users, profiles, mobileSessions, transactions, budgets, goals, gigProfiles, gigIncomeSources, gigCashEntries, gigCommitments, gigPockets, gigSplitRules, gigPayoutSplits] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("profiles").collect(),
      ctx.db.query("mobileSessions").collect(),
      ctx.db.query("transactions").collect(),
      ctx.db.query("budgets").collect(),
      ctx.db.query("goals").collect(),
      ctx.db.query("gigProfiles").collect(),
      ctx.db.query("gigIncomeSources").collect(),
      ctx.db.query("gigCashEntries").collect(),
      ctx.db.query("gigCommitments").collect(),
      ctx.db.query("gigPockets").collect(),
      ctx.db.query("gigSplitRules").collect(),
      ctx.db.query("gigPayoutSplits").collect(),
    ]);
    return {
      status: "ok" as const,
      counts: {
        users: users.length,
        profiles: profiles.length,
        mobileSessions: mobileSessions.length,
        transactions: transactions.length,
        budgets: budgets.length,
        goals: goals.length,
        gigProfiles: gigProfiles.length,
        gigIncomeSources: gigIncomeSources.length,
        gigCashEntries: gigCashEntries.length,
        gigCommitments: gigCommitments.length,
        gigPockets: gigPockets.length,
        gigSplitRules: gigSplitRules.length,
        gigPayoutSplits: gigPayoutSplits.length,
      },
    };
  },
});

export const getUser = query({
  args: {
    serverKey: v.string(),
    id: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const user = args.id
      ? await findUserById(ctx, args.id)
      : args.email
        ? await findUserByEmail(ctx, args.email)
        : null;
    return user ? await toUser(ctx, user) : null;
  },
});

export const upsertGoogleUser = mutation({
  args: {
    serverKey: v.string(),
    email: v.string(),
    googleId: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const email = args.email.toLowerCase();
    const existing = await findUserByEmail(ctx, email);
    const now = Date.now();
    if (existing) {
      const patch: Partial<Doc<"users">> = {
        googleId: args.googleId,
        name: args.name,
        updatedAt: now,
      };
      if (args.avatar !== undefined) patch.avatar = args.avatar;
      await ctx.db.patch(existing._id, patch);
      return await toUser(ctx, { ...existing, ...patch });
    }

    const id = await ctx.db.insert("users", {
      email,
      googleId: args.googleId,
      ...(args.avatar !== undefined ? { avatar: args.avatar } : {}),
      name: args.name,
      age: 18,
      userType: "COLLEGE_STUDENT",
      onboarded: false,
      createdAt: now,
      updatedAt: now,
    });
    const user = await ctx.db.get(id);
    if (!user) throw new Error("Unable to create user");
    return await toUser(ctx, user);
  },
});

const optionalText = v.optional(v.string());
const optionalNumber = v.optional(v.number());

export const completeProfile = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    age: v.number(),
    userType: v.union(
      v.literal("SCHOOL_STUDENT"),
      v.literal("COLLEGE_STUDENT"),
      v.literal("PROFESSIONAL"),
    ),
    institution: optionalText,
    monthlyAllowance: optionalNumber,
    incomeSources: v.array(v.string()),
    company: optionalText,
    monthlySalary: optionalNumber,
    industry: optionalText,
    monthlyBudget: v.number(),
    savingsGoal: v.number(),
    spendingPattern: v.string(),
    cycleStartDate: v.number(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const user = await findUserById(ctx, args.userId);
    if (!user) return false;
    const userId = publicId(user);
    const now = Date.now();
    await ctx.db.patch(user._id, {
      age: args.age,
      userType: args.userType,
      onboarded: true,
      updatedAt: now,
    });

    const profileData = {
      incomeSources: args.incomeSources,
      monthlyBudget: args.monthlyBudget,
      savingsGoal: args.savingsGoal,
      spendingPattern: args.spendingPattern,
      cycleStartDate: args.cycleStartDate,
      updatedAt: now,
      ...(args.institution !== undefined ? { institution: args.institution } : {}),
      ...(args.monthlyAllowance !== undefined ? { monthlyAllowance: args.monthlyAllowance } : {}),
      ...(args.company !== undefined ? { company: args.company } : {}),
      ...(args.monthlySalary !== undefined ? { monthlySalary: args.monthlySalary } : {}),
      ...(args.industry !== undefined ? { industry: args.industry } : {}),
    };
    const profile = await findProfile(ctx, userId);
    if (profile) {
      await ctx.db.patch(profile._id, profileData);
    } else {
      await ctx.db.insert("profiles", {
        userId,
        ...profileData,
        currency: "INR",
        createdAt: now,
      });
    }

    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .take(1);
    if (goals.length === 0 && args.savingsGoal > 0) {
      await ctx.db.insert("goals", {
        userId,
        title: "Emergency Fund",
        targetAmount: args.savingsGoal * 6,
        savedAmount: 0,
        achieved: false,
        isEssential: false,
        createdAt: now,
      });
    }
    return true;
  },
});

export const patchProfile = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    monthlyBudget: optionalNumber,
    savingsGoal: optionalNumber,
    monthlyAllowance: optionalNumber,
    monthlySalary: optionalNumber,
    institution: optionalText,
    company: optionalText,
    industry: optionalText,
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const user = await findUserById(ctx, args.userId);
    if (!user) return false;
    const userId = publicId(user);
    const profile = await findProfile(ctx, userId);
    const { serverKey: _serverKey, userId: _userId, ...updates } = args;
    void _serverKey;
    void _userId;
    const clean = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    );
    if (profile) {
      await ctx.db.patch(profile._id, { ...clean, updatedAt: Date.now() });
    } else {
      const now = Date.now();
      await ctx.db.insert("profiles", {
        userId,
        incomeSources: [],
        monthlyBudget: args.monthlyBudget ?? 0,
        savingsGoal: args.savingsGoal ?? 0,
        currency: "INR",
        spendingPattern: "BALANCED",
        cycleStartDate: 1,
        ...clean,
        createdAt: now,
        updatedAt: now,
      });
    }
    return true;
  },
});

export const createMobileSession = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    refreshTokenHash: v.string(),
    deviceLabel: v.optional(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const now = Date.now();
    const id = await ctx.db.insert("mobileSessions", {
      userId: args.userId,
      refreshTokenHash: args.refreshTokenHash,
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
      ...(args.deviceLabel !== undefined ? { deviceLabel: args.deviceLabel } : {}),
    });
    return String(id);
  },
});

export const getMobileSession = query({
  args: {
    serverKey: v.string(),
    id: v.optional(v.string()),
    refreshTokenHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    let session = args.id ? await findSessionById(ctx, args.id) : null;
    if (!session && args.refreshTokenHash) {
      const refreshTokenHash = args.refreshTokenHash;
      session = await ctx.db
        .query("mobileSessions")
        .withIndex("by_refresh_hash", (q) => q.eq("refreshTokenHash", refreshTokenHash))
        .unique();
    }
    if (!session) return null;
    const user = await findUserById(ctx, session.userId);
    if (!user) return null;
    return {
      id: publicId(session),
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      deviceLabel: session.deviceLabel ?? null,
      expiresAt: new Date(session.expiresAt).toISOString(),
      revokedAt: session.revokedAt === undefined ? null : new Date(session.revokedAt).toISOString(),
      user: await toUser(ctx, user),
    };
  },
});

export const rotateMobileSession = mutation({
  args: {
    serverKey: v.string(),
    id: v.string(),
    oldRefreshTokenHash: v.string(),
    newRefreshTokenHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const session = await findSessionById(ctx, args.id);
    if (
      !session ||
      session.refreshTokenHash !== args.oldRefreshTokenHash ||
      session.revokedAt !== undefined ||
      session.expiresAt <= Date.now()
    ) {
      return false;
    }
    await ctx.db.patch(session._id, {
      refreshTokenHash: args.newRefreshTokenHash,
      expiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const revokeMobileSession = mutation({
  args: { serverKey: v.string(), refreshTokenHash: v.string() },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const session = await ctx.db
      .query("mobileSessions")
      .withIndex("by_refresh_hash", (q) => q.eq("refreshTokenHash", args.refreshTokenHash))
      .unique();
    if (!session || session.revokedAt !== undefined) return 0;
    await ctx.db.patch(session._id, { revokedAt: Date.now(), updatedAt: Date.now() });
    return 1;
  },
});

export const listTransactions = query({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    startInclusive: v.optional(v.number()),
    endExclusive: v.optional(v.number()),
    category: v.optional(v.string()),
    excludeId: v.optional(v.string()),
    offset: v.optional(v.number()),
    limit: v.optional(v.number()),
    descending: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    let rows = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();
    rows = rows.filter((item) =>
      (args.startInclusive === undefined || item.date >= args.startInclusive) &&
      (args.endExclusive === undefined || item.date < args.endExclusive) &&
      (args.category === undefined || item.category === args.category) &&
      (args.excludeId === undefined || publicId(item) !== args.excludeId),
    );
    rows.sort((a, b) => args.descending ? b.date - a.date : a.date - b.date);
    const total = rows.length;
    const offset = Math.max(0, args.offset ?? 0);
    const limit = Math.max(0, args.limit ?? total);
    return { transactions: rows.slice(offset, offset + limit).map(toTransaction), total };
  },
});

export const createTransaction = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    amount: v.number(),
    category: v.string(),
    description: v.string(),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const createdAt = Date.now();
    const id = await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: args.amount,
      category: args.category,
      description: args.description,
      date: args.date,
      createdAt,
    });

    const transactionDate = new Date(args.date);
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_period", (q) =>
        q
          .eq("userId", args.userId)
          .eq("year", transactionDate.getUTCFullYear())
          .eq("month", transactionDate.getUTCMonth() + 1),
      )
      .collect();
    const budget = budgets.find((item) => item.category === args.category);
    if (budget) await ctx.db.patch(budget._id, { spent: budget.spent + args.amount });

    const transaction = await ctx.db.get(id);
    if (!transaction) throw new Error("Unable to create transaction");
    return toTransaction(transaction);
  },
});

export const deleteTransaction = mutation({
  args: { serverKey: v.string(), userId: v.string(), id: v.string() },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const transaction = await findTransactionById(ctx, args.id);
    if (!transaction || transaction.userId !== args.userId) return false;
    await ctx.db.delete(transaction._id);

    const transactionDate = new Date(transaction.date);
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_period", (q) =>
        q
          .eq("userId", args.userId)
          .eq("year", transactionDate.getUTCFullYear())
          .eq("month", transactionDate.getUTCMonth() + 1),
      )
      .collect();
    const budget = budgets.find((item) => item.category === transaction.category);
    if (budget) await ctx.db.patch(budget._id, { spent: Math.max(0, budget.spent - transaction.amount) });
    return true;
  },
});

export const annotateTransaction = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    id: v.string(),
    isNecessary: v.boolean(),
    aiNote: v.string(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const transaction = await findTransactionById(ctx, args.id);
    if (!transaction || transaction.userId !== args.userId) return false;
    await ctx.db.patch(transaction._id, {
      isNecessary: args.isNecessary,
      aiNote: args.aiNote,
    });
    return true;
  },
});

export const listBudgets = query({
  args: { serverKey: v.string(), userId: v.string(), month: v.number(), year: v.number() },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_period", (q) =>
        q.eq("userId", args.userId).eq("year", args.year).eq("month", args.month),
      )
      .collect();
    return budgets.map(toBudget);
  },
});

export const upsertBudget = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    category: v.string(),
    limit: v.number(),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_period", (q) =>
        q.eq("userId", args.userId).eq("year", args.year).eq("month", args.month),
      )
      .collect();
    const existing = budgets.find((item) => item.category === args.category);
    if (existing) {
      await ctx.db.patch(existing._id, { limit: args.limit });
      return toBudget({ ...existing, limit: args.limit });
    }
    const id = await ctx.db.insert("budgets", {
      userId: args.userId,
      category: args.category,
      limit: args.limit,
      month: args.month,
      year: args.year,
      spent: 0,
    });
    const budget = await ctx.db.get(id);
    if (!budget) throw new Error("Unable to create budget");
    return toBudget(budget);
  },
});

export const getBudget = query({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    category: v.string(),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_period", (q) =>
        q.eq("userId", args.userId).eq("year", args.year).eq("month", args.month),
      )
      .collect();
    const budget = budgets.find((item) => item.category === args.category);
    return budget ? toBudget(budget) : null;
  },
});

export const listGoals = query({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    includeAchieved: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    let goals = await ctx.db
      .query("goals")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    if (args.includeAchieved === false) goals = goals.filter((goal) => !goal.achieved);
    if (args.limit !== undefined) goals = goals.slice(0, Math.max(0, args.limit));
    return goals.map(toGoal);
  },
});

export const createGoal = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    title: v.string(),
    targetAmount: v.number(),
    deadline: v.optional(v.number()),
    isEssential: v.boolean(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const id = await ctx.db.insert("goals", {
      userId: args.userId,
      title: args.title,
      targetAmount: args.targetAmount,
      savedAmount: 0,
      achieved: false,
      isEssential: args.isEssential,
      createdAt: Date.now(),
      ...(args.deadline !== undefined ? { deadline: args.deadline } : {}),
    });
    const goal = await ctx.db.get(id);
    if (!goal) throw new Error("Unable to create goal");
    return toGoal(goal);
  },
});

export const updateGoal = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    id: v.string(),
    savedAmount: v.optional(v.number()),
    achieved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const goal = await findGoalById(ctx, args.id);
    if (!goal || goal.userId !== args.userId) return null;
    const patch: { savedAmount?: number; achieved?: boolean } = {};
    if (args.savedAmount !== undefined) patch.savedAmount = args.savedAmount;
    if (args.achieved !== undefined) patch.achieved = args.achieved;
    await ctx.db.patch(goal._id, patch);
    return toGoal({ ...goal, ...patch });
  },
});

export const applyGoalAllocations = mutation({
  args: {
    serverKey: v.string(),
    userId: v.string(),
    allocations: v.array(v.object({ id: v.string(), amount: v.number() })),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    if (args.allocations.length === 0 || args.allocations.length > 50) {
      throw new Error("Provide between 1 and 50 goal allocations");
    }
    const seen = new Set<string>();
    const updates: Array<{ goal: Doc<"goals">; savedAmount: number; achieved: boolean }> = [];
    for (const allocation of args.allocations) {
      if (!Number.isFinite(allocation.amount) || allocation.amount <= 0) throw new Error("Allocation amounts must be positive");
      if (seen.has(allocation.id)) throw new Error("Each goal can only be allocated once");
      seen.add(allocation.id);
      const goal = await findGoalById(ctx, allocation.id);
      if (!goal || goal.userId !== args.userId) throw new Error("Goal not found");
      if (goal.achieved) throw new Error(`${goal.title} is already complete`);
      const savedAmount = Math.min(goal.targetAmount, goal.savedAmount + allocation.amount);
      updates.push({ goal, savedAmount, achieved: savedAmount >= goal.targetAmount });
    }
    for (const update of updates) {
      await ctx.db.patch(update.goal._id, { savedAmount: update.savedAmount, achieved: update.achieved });
    }
    return updates.map((update) => toGoal({ ...update.goal, savedAmount: update.savedAmount, achieved: update.achieved }));
  },
});
