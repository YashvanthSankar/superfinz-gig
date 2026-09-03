import { v } from "convex/values";
import { mutation } from "./_generated/server";

function assertServerKey(serverKey: string) {
  const configured = process.env.SUPERFINZ_SERVER_KEY;
  if (!configured || serverKey !== configured)
    throw new Error("Unauthorized server request");
}

export const removeSmokeTestUser = mutation({
  args: { serverKey: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const email = args.email.toLowerCase();
    if (!email.endsWith("@example.test"))
      throw new Error("Only smoke-test users can be removed");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!user || !user.googleId?.startsWith("smoke-test-")) return false;
    const userId = user.externalId ?? String(user._id);

    const [
      profiles,
      sessions,
      transactions,
      budgets,
      goals,
      gigProfiles,
      gigSources,
      gigEntries,
      gigCommitments,
      gigPockets,
      gigRules,
      gigSplits,
      gigPreferences,
      gigNotificationStates,
      gigOutcomeEvents,
    ] = await Promise.all([
      ctx.db
        .query("profiles")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("mobileSessions")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("transactions")
        .withIndex("by_user_date", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("budgets")
        .withIndex("by_user_period", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("goals")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("gigProfiles")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("gigIncomeSources")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("gigCashEntries")
        .withIndex("by_user_date", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("gigCommitments")
        .withIndex("by_user_due", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("gigPockets")
        .withIndex("by_user_kind", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("gigSplitRules")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("gigPayoutSplits")
        .withIndex("by_user_received", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("gigPreferences")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("gigNotificationStates")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("gigOutcomeEvents")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .collect(),
    ]);
    for (const document of [
      ...profiles,
      ...sessions,
      ...transactions,
      ...budgets,
      ...goals,
      ...gigProfiles,
      ...gigSources,
      ...gigEntries,
      ...gigCommitments,
      ...gigPockets,
      ...gigRules,
      ...gigSplits,
      ...gigPreferences,
      ...gigNotificationStates,
      ...gigOutcomeEvents,
    ]) {
      await ctx.db.delete(document._id);
    }
    await ctx.db.delete(user._id);
    return true;
  },
});
