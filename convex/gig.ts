import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";

type ReadCtx = QueryCtx | MutationCtx;

function assertServerKey(value: string) {
  const configured = process.env.SUPERFINZ_SERVER_KEY;
  if (!configured || value !== configured) throw new Error("Unauthorized");
}

const iso = (value?: number) => value === undefined ? null : new Date(value).toISOString();
const publicId = (doc: { _id: string }) => doc._id;

async function findUser(ctx: ReadCtx, id: string) {
  const nativeId = ctx.db.normalizeId("users", id);
  if (nativeId) {
    const user = await ctx.db.get(nativeId);
    if (user) return user;
  }
  return await ctx.db.query("users").withIndex("by_external_id", (q) => q.eq("externalId", id)).unique();
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

const sourceValidator = v.object({ name: v.string(), type: v.string(), frequency: v.string(), typicalMin: v.number(), typicalMax: v.number(), payoutDay: v.optional(v.number()), nextPayoutAt: v.optional(v.number()), connectionMode: v.string(), prototype: v.boolean() });
const commitmentValidator = v.object({ title: v.string(), category: v.string(), amount: v.number(), dueDate: v.number(), recurrence: v.string(), essential: v.boolean(), priority: v.number(), autopay: v.boolean() });
const splitRuleValidator = v.object({ essentialsPct: v.number(), workCostsPct: v.number(), emergencyPct: v.number(), longTermPct: v.number(), flexiblePct: v.number(), enabled: v.boolean() });

function toProfile(doc: Doc<"gigProfiles">) { return { id: publicId(doc), userId: doc.userId, preferredName: doc.preferredName, city: doc.city, preferredLanguage: doc.preferredLanguage, workTypes: doc.workTypes, primaryPriority: doc.primaryPriority, lowWeekIncome: doc.lowWeekIncome, typicalWeekIncome: doc.typicalWeekIncome, goodWeekIncome: doc.goodWeekIncome, workDaysPerWeek: doc.workDaysPerWeek, platformDeductionRate: doc.platformDeductionRate, weeklyWorkCosts: doc.weeklyWorkCosts, openingBalance: doc.openingBalance, currentBalance: doc.currentBalance, safetyBuffer: doc.safetyBuffer, cushionTargetDays: doc.cushionTargetDays, createdAt: new Date(doc.createdAt).toISOString(), updatedAt: new Date(doc.updatedAt).toISOString() }; }
function toSource(doc: Doc<"gigIncomeSources">) { return { id: publicId(doc), userId: doc.userId, name: doc.name, type: doc.type, frequency: doc.frequency, typicalMin: doc.typicalMin, typicalMax: doc.typicalMax, payoutDay: doc.payoutDay ?? null, nextPayoutAt: iso(doc.nextPayoutAt), connectionMode: doc.connectionMode, status: doc.status, prototype: doc.prototype, consentAt: iso(doc.consentAt), consentExpiresAt: iso(doc.consentExpiresAt), lastSyncAt: iso(doc.lastSyncAt), createdAt: new Date(doc.createdAt).toISOString(), updatedAt: new Date(doc.updatedAt).toISOString() }; }
function toEntry(doc: Doc<"gigCashEntries">) { return { id: publicId(doc), userId: doc.userId, kind: doc.kind, amount: doc.amount, sourceId: doc.sourceId ?? null, sourceName: doc.sourceName ?? null, category: doc.category, paymentMethod: doc.paymentMethod, note: doc.note ?? null, workRelated: doc.workRelated, status: doc.status, pocketDebit: doc.pocketDebit ?? null, payoutSplitId: doc.payoutSplitId ?? null, commitmentId: doc.commitmentId ?? null, commitmentDueDate: iso(doc.commitmentDueDate), date: new Date(doc.date).toISOString(), createdAt: new Date(doc.createdAt).toISOString() }; }
function toCommitment(doc: Doc<"gigCommitments">) { return { id: publicId(doc), userId: doc.userId, title: doc.title, category: doc.category, amount: doc.amount, dueDate: new Date(doc.dueDate).toISOString(), recurrence: doc.recurrence, essential: doc.essential, priority: doc.priority, autopay: doc.autopay, fundedAmount: doc.fundedAmount, status: doc.status, createdAt: new Date(doc.createdAt).toISOString(), updatedAt: new Date(doc.updatedAt).toISOString() }; }
function toPocket(doc: Doc<"gigPockets">) { return { id: publicId(doc), userId: doc.userId, kind: doc.kind, currentAmount: doc.currentAmount, targetAmount: doc.targetAmount, updatedAt: new Date(doc.updatedAt).toISOString() }; }
function toRule(doc: Doc<"gigSplitRules">) { return { id: publicId(doc), userId: doc.userId, essentialsPct: doc.essentialsPct, workCostsPct: doc.workCostsPct, emergencyPct: doc.emergencyPct, longTermPct: doc.longTermPct, flexiblePct: doc.flexiblePct, enabled: doc.enabled, updatedAt: new Date(doc.updatedAt).toISOString() }; }
function toPayoutSplit(doc: Doc<"gigPayoutSplits">) { return { id: publicId(doc), userId: doc.userId, sourceId: doc.sourceId ?? null, sourceName: doc.sourceName, amount: doc.amount, receivedAt: new Date(doc.receivedAt).toISOString(), essentialsAmount: doc.essentialsAmount, workCostsAmount: doc.workCostsAmount, emergencyAmount: doc.emergencyAmount, longTermAmount: doc.longTermAmount, flexibleAmount: doc.flexibleAmount, note: doc.note ?? null, createdAt: new Date(doc.createdAt).toISOString() }; }

async function bundleForUser(ctx: ReadCtx, userId: string) {
  const [profile, sources, entries, commitments, pockets, splitRule, payoutSplits] = await Promise.all([
    ctx.db.query("gigProfiles").withIndex("by_user_id", (q) => q.eq("userId", userId)).unique(),
    ctx.db.query("gigIncomeSources").withIndex("by_user_id", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("gigCashEntries").withIndex("by_user_date", (q) => q.eq("userId", userId)).order("desc").take(500),
    ctx.db.query("gigCommitments").withIndex("by_user_due", (q) => q.eq("userId", userId)).order("asc").collect(),
    ctx.db.query("gigPockets").withIndex("by_user_kind", (q) => q.eq("userId", userId)).collect(),
    ctx.db.query("gigSplitRules").withIndex("by_user_id", (q) => q.eq("userId", userId)).unique(),
    ctx.db.query("gigPayoutSplits").withIndex("by_user_received", (q) => q.eq("userId", userId)).order("desc").take(50),
  ]);
  if (!profile || !splitRule) return null;
  return { profile: toProfile(profile), sources: sources.map(toSource), entries: entries.map(toEntry), commitments: commitments.map(toCommitment), pockets: pockets.map(toPocket), splitRule: toRule(splitRule), payoutSplits: payoutSplits.map(toPayoutSplit) };
}

export const getBundle = query({
  args: { serverKey: v.string(), userId: v.string() },
  handler: async (ctx, args) => { assertServerKey(args.serverKey); return await bundleForUser(ctx, args.userId); },
});

export const completeOnboarding = mutation({
  args: { serverKey: v.string(), userId: v.string(), preferredName: v.string(), city: v.string(), preferredLanguage: v.string(), workTypes: v.array(v.string()), primaryPriority: v.string(), lowWeekIncome: v.number(), typicalWeekIncome: v.number(), goodWeekIncome: v.number(), workDaysPerWeek: v.number(), platformDeductionRate: v.number(), weeklyWorkCosts: v.number(), openingBalance: v.number(), currentCushion: v.number(), safetyBuffer: v.number(), cushionTargetDays: v.number(), sources: v.array(sourceValidator), commitments: v.array(commitmentValidator), splitRule: splitRuleValidator },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey); const user = await findUser(ctx, args.userId); if (!user) throw new Error("User not found"); const now = Date.now();
    const oldDocs = await Promise.all([
      ctx.db.query("gigProfiles").withIndex("by_user_id", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("gigIncomeSources").withIndex("by_user_id", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("gigCommitments").withIndex("by_user_due", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("gigPockets").withIndex("by_user_kind", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("gigSplitRules").withIndex("by_user_id", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("gigCashEntries").withIndex("by_user_date", (q) => q.eq("userId", args.userId)).collect(),
      ctx.db.query("gigPayoutSplits").withIndex("by_user_received", (q) => q.eq("userId", args.userId)).collect(),
    ]);
    for (const docs of oldDocs) for (const doc of docs) await ctx.db.delete(doc._id);
    await ctx.db.insert("gigProfiles", { userId: args.userId, preferredName: args.preferredName, city: args.city, preferredLanguage: args.preferredLanguage, workTypes: args.workTypes, primaryPriority: args.primaryPriority, lowWeekIncome: args.lowWeekIncome, typicalWeekIncome: args.typicalWeekIncome, goodWeekIncome: args.goodWeekIncome, workDaysPerWeek: args.workDaysPerWeek, platformDeductionRate: args.platformDeductionRate, weeklyWorkCosts: args.weeklyWorkCosts, openingBalance: args.openingBalance, currentBalance: args.openingBalance, safetyBuffer: args.safetyBuffer, cushionTargetDays: args.cushionTargetDays, createdAt: now, updatedAt: now });
    for (const source of args.sources) await ctx.db.insert("gigIncomeSources", { userId: args.userId, ...source, status: "ACTIVE", ...(source.connectionMode.startsWith("SIMULATED") ? { consentAt: now, consentExpiresAt: now + 90 * 86_400_000, lastSyncAt: now } : {}), createdAt: now, updatedAt: now });
    for (const commitment of args.commitments) await ctx.db.insert("gigCommitments", { userId: args.userId, ...commitment, fundedAmount: 0, status: "DUE", createdAt: now, updatedAt: now });
    const essentialTarget = args.commitments.filter((item) => item.essential).reduce((sum, item) => sum + item.amount, 0); const pocketRows = [
      { kind: "ESSENTIALS", currentAmount: 0, targetAmount: essentialTarget },
      { kind: "WORK_COSTS", currentAmount: 0, targetAmount: args.weeklyWorkCosts },
      { kind: "EMERGENCY_CUSHION", currentAmount: Math.min(args.currentCushion, args.openingBalance), targetAmount: Math.max(args.currentCushion, args.safetyBuffer, essentialTarget / 30 * args.cushionTargetDays) },
      { kind: "LONG_TERM_SAVINGS", currentAmount: 0, targetAmount: args.typicalWeekIncome * 4 },
      { kind: "FLEXIBLE_SPENDING", currentAmount: 0, targetAmount: args.typicalWeekIncome * args.splitRule.flexiblePct / 100 },
    ];
    for (const pocket of pocketRows) await ctx.db.insert("gigPockets", { userId: args.userId, ...pocket, updatedAt: now });
    await ctx.db.insert("gigSplitRules", { userId: args.userId, ...args.splitRule, updatedAt: now });
    await ctx.db.patch(user._id, { name: args.preferredName, onboarded: true, updatedAt: now });
    return await bundleForUser(ctx, args.userId);
  },
});

async function profileForUser(ctx: MutationCtx, userId: string) { const profile = await ctx.db.query("gigProfiles").withIndex("by_user_id", (q) => q.eq("userId", userId)).unique(); if (!profile) throw new Error("Complete onboarding first"); return profile; }
const balanceDelta = (kind: string, amount: number, status: string) => !["SETTLED", "PAID"].includes(status) ? 0 : kind === "INCOME" ? amount : ["WORK_EXPENSE", "ESSENTIAL_EXPENSE", "FLEXIBLE_EXPENSE", "COMMITMENT_PAYMENT"].includes(kind) ? -amount : 0;
const pocketForKind = (kind: string) => kind === "WORK_EXPENSE" ? "WORK_COSTS" : ["ESSENTIAL_EXPENSE", "COMMITMENT_PAYMENT"].includes(kind) ? "ESSENTIALS" : kind === "FLEXIBLE_EXPENSE" ? "FLEXIBLE_SPENDING" : null;
async function adjustPocket(ctx: MutationCtx, userId: string, kind: string, amount: number) {
  const pocketKind = pocketForKind(kind); if (!pocketKind) return 0;
  const pocket = await ctx.db.query("gigPockets").withIndex("by_user_kind", (q) => q.eq("userId", userId).eq("kind", pocketKind)).unique();
  if (!pocket) return 0;
  const next = Math.max(0, pocket.currentAmount + amount);
  await ctx.db.patch(pocket._id, { currentAmount: next, updatedAt: Date.now() });
  return next - pocket.currentAmount;
}
async function adjustPocketTarget(ctx: MutationCtx, userId: string, kind: string, amount: number) { const pocket = await ctx.db.query("gigPockets").withIndex("by_user_kind", (q) => q.eq("userId", userId).eq("kind", kind)).unique(); if (pocket) await ctx.db.patch(pocket._id, { targetAmount: Math.max(0, pocket.targetAmount + amount), updatedAt: Date.now() }); }
function nextCommitmentDue(dueDate: number, recurrence: string, after: number) { const next = new Date(dueDate); const advance = () => { if (recurrence === "WEEKLY") next.setDate(next.getDate() + 7); else if (recurrence === "FORTNIGHTLY") next.setDate(next.getDate() + 14); else if (recurrence === "MONTHLY") next.setMonth(next.getMonth() + 1); else if (recurrence === "QUARTERLY") next.setMonth(next.getMonth() + 3); else if (recurrence === "YEARLY") next.setFullYear(next.getFullYear() + 1); }; do advance(); while (next.getTime() <= after); return next.getTime(); }

export const createEntry = mutation({
  args: { serverKey: v.string(), userId: v.string(), kind: v.string(), amount: v.number(), sourceId: v.optional(v.string()), sourceName: v.optional(v.string()), category: v.string(), paymentMethod: v.string(), note: v.optional(v.string()), workRelated: v.boolean(), status: v.string(), date: v.number() },
  handler: async (ctx, args) => { assertServerKey(args.serverKey); if (args.amount <= 0) throw new Error("Amount must be positive"); const profile = await profileForUser(ctx, args.userId); if (args.sourceId) { const source = await findSource(ctx, args.sourceId); if (!source || source.userId !== args.userId) throw new Error("Income source not found"); } const now = Date.now(); const id = await ctx.db.insert("gigCashEntries", { userId: args.userId, kind: args.kind, amount: args.amount, ...(args.sourceId ? { sourceId: args.sourceId } : {}), ...(args.sourceName ? { sourceName: args.sourceName } : {}), category: args.category, paymentMethod: args.paymentMethod, ...(args.note ? { note: args.note } : {}), workRelated: args.workRelated, status: args.status, date: args.date, createdAt: now }); const delta = balanceDelta(args.kind, args.amount, args.status); if (delta) { await ctx.db.patch(profile._id, { currentBalance: profile.currentBalance + delta, updatedAt: now }); if (delta < 0) { const applied = await adjustPocket(ctx, args.userId, args.kind, delta); if (applied < 0) await ctx.db.patch(id, { pocketDebit: -applied }); } } const entry = await ctx.db.get(id); if (!entry) throw new Error("Unable to create entry"); return toEntry(entry); },
});

export const deleteEntry = mutation({
  args: { serverKey: v.string(), userId: v.string(), id: v.string() },
  handler: async (ctx, args) => { assertServerKey(args.serverKey); const entry = await findEntry(ctx, args.id); if (!entry || entry.userId !== args.userId) return false; if (entry.payoutSplitId) throw new Error("Payout records cannot be deleted from the cashbook"); const profile = await profileForUser(ctx, args.userId); const delta = balanceDelta(entry.kind, entry.amount, entry.status); if (entry.commitmentId) { const commitment = await findCommitment(ctx, entry.commitmentId); if (!commitment || commitment.userId !== args.userId) throw new Error("Linked commitment not found"); await ctx.db.patch(commitment._id, { status: "DUE", fundedAmount: 0, ...(entry.commitmentDueDate ? { dueDate: entry.commitmentDueDate } : {}), updatedAt: Date.now() }); if (commitment.essential && commitment.recurrence === "ONE_TIME" && commitment.status === "PAID") await adjustPocketTarget(ctx, args.userId, "ESSENTIALS", commitment.amount); } await ctx.db.delete(entry._id); if (delta) { await ctx.db.patch(profile._id, { currentBalance: profile.currentBalance - delta, updatedAt: Date.now() }); if (delta < 0 && entry.pocketDebit) await adjustPocket(ctx, args.userId, entry.kind, entry.pocketDebit); } return true; },
});

export const createSource = mutation({
  args: { serverKey: v.string(), userId: v.string(), source: sourceValidator },
  handler: async (ctx, args) => { assertServerKey(args.serverKey); await profileForUser(ctx, args.userId); const now = Date.now(); const id = await ctx.db.insert("gigIncomeSources", { userId: args.userId, ...args.source, status: "ACTIVE", ...(args.source.connectionMode.startsWith("SIMULATED") ? { consentAt: now, consentExpiresAt: now + 90 * 86_400_000, lastSyncAt: now } : {}), createdAt: now, updatedAt: now }); const source = await ctx.db.get(id); if (!source) throw new Error("Unable to create source"); return toSource(source); },
});

export const updateSourceStatus = mutation({
  args: { serverKey: v.string(), userId: v.string(), id: v.string(), status: v.string() },
  handler: async (ctx, args) => { assertServerKey(args.serverKey); const source = await findSource(ctx, args.id); if (!source || source.userId !== args.userId) return null; const now = Date.now(); const patch = { status: args.status, ...(args.status === "REVOKED" ? { consentExpiresAt: now } : {}), updatedAt: now }; await ctx.db.patch(source._id, patch); return toSource({ ...source, ...patch }); },
});

export const createCommitment = mutation({
  args: { serverKey: v.string(), userId: v.string(), commitment: commitmentValidator },
  handler: async (ctx, args) => { assertServerKey(args.serverKey); await profileForUser(ctx, args.userId); const now = Date.now(); const id = await ctx.db.insert("gigCommitments", { userId: args.userId, ...args.commitment, fundedAmount: 0, status: "DUE", createdAt: now, updatedAt: now }); if (args.commitment.essential) await adjustPocketTarget(ctx, args.userId, "ESSENTIALS", args.commitment.amount); const commitment = await ctx.db.get(id); if (!commitment) throw new Error("Unable to create commitment"); return toCommitment(commitment); },
});

export const updateCommitment = mutation({
  args: { serverKey: v.string(), userId: v.string(), id: v.string(), dueDate: v.optional(v.number()), amount: v.optional(v.number()), status: v.optional(v.string()) },
  handler: async (ctx, args) => { assertServerKey(args.serverKey); const commitment = await findCommitment(ctx, args.id); if (!commitment || commitment.userId !== args.userId) return null; const now = Date.now(); const patch = { ...(args.dueDate !== undefined ? { dueDate: args.dueDate } : {}), ...(args.amount !== undefined ? { amount: args.amount } : {}), ...(args.status !== undefined ? { status: args.status } : {}), updatedAt: now }; await ctx.db.patch(commitment._id, patch); if (commitment.essential && args.amount !== undefined && !(commitment.recurrence === "ONE_TIME" && commitment.status === "PAID")) await adjustPocketTarget(ctx, args.userId, "ESSENTIALS", args.amount - commitment.amount); return toCommitment({ ...commitment, ...patch }); },
});

export const markCommitmentPaid = mutation({
  args: { serverKey: v.string(), userId: v.string(), id: v.string(), paidAt: v.number() },
  handler: async (ctx, args) => { assertServerKey(args.serverKey); const commitment = await findCommitment(ctx, args.id); if (!commitment || commitment.userId !== args.userId) return null; if (commitment.status === "PAID") return toCommitment(commitment); const profile = await profileForUser(ctx, args.userId); const now = Date.now(); const recurring = commitment.recurrence !== "ONE_TIME"; const nextState = { status: recurring ? "DUE" : "PAID", fundedAmount: recurring ? 0 : commitment.amount, ...(recurring ? { dueDate: nextCommitmentDue(commitment.dueDate, commitment.recurrence, args.paidAt) } : {}), updatedAt: now }; await ctx.db.patch(commitment._id, nextState); if (!recurring && commitment.essential) await adjustPocketTarget(ctx, args.userId, "ESSENTIALS", -commitment.amount); await ctx.db.patch(profile._id, { currentBalance: profile.currentBalance - commitment.amount, updatedAt: now }); const applied = await adjustPocket(ctx, args.userId, "COMMITMENT_PAYMENT", -commitment.amount); await ctx.db.insert("gigCashEntries", { userId: args.userId, kind: "COMMITMENT_PAYMENT", amount: commitment.amount, category: commitment.category, paymentMethod: commitment.autopay ? "AUTOPAY" : "MANUAL", note: `Paid ${commitment.title}`, workRelated: false, status: "PAID", commitmentId: String(commitment._id), commitmentDueDate: commitment.dueDate, ...(applied < 0 ? { pocketDebit: -applied } : {}), date: args.paidAt, createdAt: now }); return toCommitment({ ...commitment, ...nextState }); },
});

export const deleteCommitment = mutation({
  args: { serverKey: v.string(), userId: v.string(), id: v.string() },
  handler: async (ctx, args) => { assertServerKey(args.serverKey); const commitment = await findCommitment(ctx, args.id); if (!commitment || commitment.userId !== args.userId) return false; const entries = await ctx.db.query("gigCashEntries").withIndex("by_user_date", (q) => q.eq("userId", args.userId)).collect(); for (const entry of entries) if (entry.commitmentId === String(commitment._id)) await ctx.db.patch(entry._id, { commitmentId: undefined, commitmentDueDate: undefined }); if (commitment.essential && !(commitment.recurrence === "ONE_TIME" && commitment.status === "PAID")) await adjustPocketTarget(ctx, args.userId, "ESSENTIALS", -commitment.amount); await ctx.db.delete(commitment._id); return true; },
});

const roundMoney = (value: number) => Math.round(value * 100) / 100;
async function addToPocket(ctx: MutationCtx, userId: string, kind: string, amount: number) { const pocket = await ctx.db.query("gigPockets").withIndex("by_user_kind", (q) => q.eq("userId", userId).eq("kind", kind)).unique(); if (!pocket) throw new Error(`Missing ${kind} pocket`); await ctx.db.patch(pocket._id, { currentAmount: pocket.currentAmount + amount, updatedAt: Date.now() }); }

export const applyPayoutSplit = mutation({
  args: { serverKey: v.string(), userId: v.string(), sourceId: v.optional(v.string()), sourceName: v.string(), amount: v.number(), receivedAt: v.number(), note: v.optional(v.string()), percentages: v.object({ essentialsPct: v.number(), workCostsPct: v.number(), emergencyPct: v.number(), longTermPct: v.number(), flexiblePct: v.number() }) },
  handler: async (ctx, args) => { assertServerKey(args.serverKey); if (args.amount <= 0) throw new Error("Amount must be positive"); const totalPct = Object.values(args.percentages).reduce((sum, value) => sum + value, 0); if (Math.abs(totalPct - 100) > .001) throw new Error("Smart Split must total 100%"); if (args.sourceId) { const source = await findSource(ctx, args.sourceId); if (!source || source.userId !== args.userId) throw new Error("Income source not found"); if (source.status !== "ACTIVE") throw new Error("Income source is not active"); } const profile = await profileForUser(ctx, args.userId); const now = Date.now(); const essentialsAmount = roundMoney(args.amount * args.percentages.essentialsPct / 100); const workCostsAmount = roundMoney(args.amount * args.percentages.workCostsPct / 100); const emergencyAmount = roundMoney(args.amount * args.percentages.emergencyPct / 100); const longTermAmount = roundMoney(args.amount * args.percentages.longTermPct / 100); const flexibleAmount = roundMoney(args.amount - essentialsAmount - workCostsAmount - emergencyAmount - longTermAmount); const splitId = await ctx.db.insert("gigPayoutSplits", { userId: args.userId, ...(args.sourceId ? { sourceId: args.sourceId } : {}), sourceName: args.sourceName, amount: args.amount, receivedAt: args.receivedAt, essentialsAmount, workCostsAmount, emergencyAmount, longTermAmount, flexibleAmount, ...(args.note ? { note: args.note } : {}), createdAt: now }); await ctx.db.insert("gigCashEntries", { userId: args.userId, kind: "INCOME", amount: args.amount, ...(args.sourceId ? { sourceId: args.sourceId } : {}), sourceName: args.sourceName, category: "Payout", paymentMethod: "PLATFORM", ...(args.note ? { note: args.note } : {}), workRelated: false, status: "SETTLED", payoutSplitId: String(splitId), date: args.receivedAt, createdAt: now }); await ctx.db.patch(profile._id, { currentBalance: profile.currentBalance + args.amount, updatedAt: now }); await addToPocket(ctx, args.userId, "ESSENTIALS", essentialsAmount); await addToPocket(ctx, args.userId, "WORK_COSTS", workCostsAmount); await addToPocket(ctx, args.userId, "EMERGENCY_CUSHION", emergencyAmount); await addToPocket(ctx, args.userId, "LONG_TERM_SAVINGS", longTermAmount); await addToPocket(ctx, args.userId, "FLEXIBLE_SPENDING", flexibleAmount); const split = await ctx.db.get(splitId); if (!split) throw new Error("Unable to save payout split"); return toPayoutSplit(split); },
});

export const updateSettings = mutation({
  args: { serverKey: v.string(), userId: v.string(), preferredName: v.optional(v.string()), city: v.optional(v.string()), preferredLanguage: v.optional(v.string()), safetyBuffer: v.optional(v.number()), cushionTargetDays: v.optional(v.number()), splitRule: v.optional(splitRuleValidator) },
  handler: async (ctx, args) => { assertServerKey(args.serverKey); const profile = await profileForUser(ctx, args.userId); const now = Date.now(); const profilePatch = { ...(args.preferredName !== undefined ? { preferredName: args.preferredName } : {}), ...(args.city !== undefined ? { city: args.city } : {}), ...(args.preferredLanguage !== undefined ? { preferredLanguage: args.preferredLanguage } : {}), ...(args.safetyBuffer !== undefined ? { safetyBuffer: args.safetyBuffer } : {}), ...(args.cushionTargetDays !== undefined ? { cushionTargetDays: args.cushionTargetDays } : {}), updatedAt: now }; await ctx.db.patch(profile._id, profilePatch); if (args.splitRule) { const rule = await ctx.db.query("gigSplitRules").withIndex("by_user_id", (q) => q.eq("userId", args.userId)).unique(); if (!rule) throw new Error("Split rule not found"); await ctx.db.patch(rule._id, { ...args.splitRule, updatedAt: now }); } return await bundleForUser(ctx, args.userId); },
});
