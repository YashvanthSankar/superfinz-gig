import "server-only";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import type { CashEntryDto, CommitmentDto, GigBundleDto, GigIncomeSourceDto, PayoutSplitDto } from "@superfinz/shared";
import { api } from "../../convex/_generated/api";

function serverKey() {
  const value = process.env.SUPERFINZ_SERVER_KEY;
  if (!value) throw new Error("SUPERFINZ_SERVER_KEY is not configured");
  return value;
}

export async function getGigBundle(userId: string): Promise<GigBundleDto | null> {
  return await fetchQuery(api.gig.getBundle, { serverKey: serverKey(), userId }) as GigBundleDto | null;
}

export async function completeGigOnboarding(userId: string, input: {
  preferredName: string; city: string; preferredLanguage: string; workTypes: string[]; primaryPriority: string; lowWeekIncome: number; typicalWeekIncome: number; goodWeekIncome: number; workDaysPerWeek: number; platformDeductionRate: number; weeklyWorkCosts: number; openingBalance: number; currentCushion: number; safetyBuffer: number; cushionTargetDays: number;
  sources: Array<{ name: string; type: string; frequency: string; typicalMin: number; typicalMax: number; payoutDay?: number | null; nextPayoutAt?: string | null; connectionMode: string; prototype: boolean }>;
  commitments: Array<{ title: string; category: string; amount: number; dueDate: string; recurrence: string; essential: boolean; priority: number; autopay: boolean }>;
  splitRule: { essentialsPct: number; workCostsPct: number; emergencyPct: number; longTermPct: number; flexiblePct: number; enabled: boolean };
}): Promise<GigBundleDto | null> {
  return await fetchMutation(api.gig.completeOnboarding, {
    serverKey: serverKey(), userId, ...input,
    sources: input.sources.map((source) => ({ name: source.name, type: source.type, frequency: source.frequency, typicalMin: source.typicalMin, typicalMax: source.typicalMax, ...(source.payoutDay !== null && source.payoutDay !== undefined ? { payoutDay: source.payoutDay } : {}), ...(source.nextPayoutAt ? { nextPayoutAt: new Date(source.nextPayoutAt).getTime() } : {}), connectionMode: source.connectionMode, prototype: source.prototype })),
    commitments: input.commitments.map((commitment) => ({ ...commitment, dueDate: new Date(commitment.dueDate).getTime() })),
  }) as GigBundleDto | null;
}

export async function createGigEntry(userId: string, input: { kind: string; amount: number; sourceId?: string | null; sourceName?: string | null; category: string; paymentMethod: string; note?: string | null; workRelated: boolean; status: string; date: string }): Promise<CashEntryDto> {
  return await fetchMutation(api.gig.createEntry, { serverKey: serverKey(), userId, kind: input.kind, amount: input.amount, ...(input.sourceId ? { sourceId: input.sourceId } : {}), ...(input.sourceName ? { sourceName: input.sourceName } : {}), category: input.category, paymentMethod: input.paymentMethod, ...(input.note ? { note: input.note } : {}), workRelated: input.workRelated, status: input.status, date: new Date(input.date).getTime() }) as CashEntryDto;
}

export async function deleteGigEntry(userId: string, id: string) { return await fetchMutation(api.gig.deleteEntry, { serverKey: serverKey(), userId, id }); }

export async function createGigSource(userId: string, source: { name: string; type: string; frequency: string; typicalMin: number; typicalMax: number; payoutDay?: number | null; nextPayoutAt?: string | null; connectionMode: string; prototype: boolean }): Promise<GigIncomeSourceDto> {
  return await fetchMutation(api.gig.createSource, { serverKey: serverKey(), userId, source: { name: source.name, type: source.type, frequency: source.frequency, typicalMin: source.typicalMin, typicalMax: source.typicalMax, ...(source.payoutDay !== null && source.payoutDay !== undefined ? { payoutDay: source.payoutDay } : {}), ...(source.nextPayoutAt ? { nextPayoutAt: new Date(source.nextPayoutAt).getTime() } : {}), connectionMode: source.connectionMode, prototype: source.prototype } }) as GigIncomeSourceDto;
}

export async function updateGigSourceStatus(userId: string, id: string, status: string): Promise<GigIncomeSourceDto | null> { return await fetchMutation(api.gig.updateSourceStatus, { serverKey: serverKey(), userId, id, status }) as GigIncomeSourceDto | null; }

export async function createGigCommitment(userId: string, commitment: { title: string; category: string; amount: number; dueDate: string; recurrence: string; essential: boolean; priority: number; autopay: boolean }): Promise<CommitmentDto> {
  return await fetchMutation(api.gig.createCommitment, { serverKey: serverKey(), userId, commitment: { ...commitment, dueDate: new Date(commitment.dueDate).getTime() } }) as CommitmentDto;
}

export async function updateGigCommitment(userId: string, input: { id: string; dueDate?: string; amount?: number; status?: string }): Promise<CommitmentDto | null> { return await fetchMutation(api.gig.updateCommitment, { serverKey: serverKey(), userId, id: input.id, ...(input.dueDate ? { dueDate: new Date(input.dueDate).getTime() } : {}), ...(input.amount !== undefined ? { amount: input.amount } : {}), ...(input.status ? { status: input.status } : {}) }) as CommitmentDto | null; }
export async function markGigCommitmentPaid(userId: string, id: string, paidAt: string): Promise<CommitmentDto | null> { return await fetchMutation(api.gig.markCommitmentPaid, { serverKey: serverKey(), userId, id, paidAt: new Date(paidAt).getTime() }) as CommitmentDto | null; }
export async function deleteGigCommitment(userId: string, id: string) { return await fetchMutation(api.gig.deleteCommitment, { serverKey: serverKey(), userId, id }); }

export async function applyGigPayoutSplit(userId: string, input: { sourceId?: string | null; sourceName: string; amount: number; receivedAt: string; note?: string | null; percentages: { essentialsPct: number; workCostsPct: number; emergencyPct: number; longTermPct: number; flexiblePct: number } }): Promise<PayoutSplitDto> {
  return await fetchMutation(api.gig.applyPayoutSplit, { serverKey: serverKey(), userId, ...(input.sourceId ? { sourceId: input.sourceId } : {}), sourceName: input.sourceName, amount: input.amount, receivedAt: new Date(input.receivedAt).getTime(), ...(input.note ? { note: input.note } : {}), percentages: input.percentages }) as PayoutSplitDto;
}

export async function updateGigSettings(userId: string, input: { preferredName?: string; city?: string; preferredLanguage?: string; safetyBuffer?: number; cushionTargetDays?: number; splitRule?: { essentialsPct: number; workCostsPct: number; emergencyPct: number; longTermPct: number; flexiblePct: number; enabled: boolean } }): Promise<GigBundleDto | null> {
  return await fetchMutation(api.gig.updateSettings, { serverKey: serverKey(), userId, ...input }) as GigBundleDto | null;
}
