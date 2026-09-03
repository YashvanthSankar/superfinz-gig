import "server-only";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import type {
  CashEntryDto,
  CommitmentDto,
  GigBundleDto,
  GigIncomeSourceDto,
  GigNotificationStateDto,
  GigPartnerMetricsDto,
  GigPreferencesDto,
  PayoutSplitDto,
  GigVirtualTabDto,
} from "@superfinz/shared";
import { api } from "../../convex/_generated/api";

function serverKey() {
  const value = process.env.SUPERFINZ_SERVER_KEY;
  if (!value) throw new Error("SUPERFINZ_SERVER_KEY is not configured");
  return value;
}

export async function listGigVirtualTabs(
  userId: string,
): Promise<GigVirtualTabDto[]> {
  return (await fetchQuery(api.gig.listVirtualTabs, {
    serverKey: serverKey(),
    userId,
  })) as GigVirtualTabDto[];
}

export async function ensureGigSafetyTab(userId: string) {
  return (await fetchMutation(api.gig.ensureSafetyTab, {
    serverKey: serverKey(),
    userId,
  })) as GigVirtualTabDto;
}

export async function createGigVirtualTab(
  userId: string,
  input: {
    tabName: string;
    balance: number;
    targetAmount?: number | null;
    priority?: number;
    isEssential?: boolean;
    purpose?: string | null;
  },
): Promise<GigVirtualTabDto> {
  return (await fetchMutation(api.gig.createVirtualTab, {
    serverKey: serverKey(),
    userId,
    ...input,
  })) as GigVirtualTabDto;
}

export async function updateGigVirtualTab(
  userId: string,
  input: {
    tabId: string;
    tabName?: string;
    isLocked?: boolean;
    targetAmount?: number | null;
    priority?: number;
    isEssential?: boolean;
    purpose?: string | null;
  },
): Promise<GigVirtualTabDto> {
  return (await fetchMutation(api.gig.updateVirtualTab, {
    serverKey: serverKey(),
    userId,
    ...input,
  })) as GigVirtualTabDto;
}

export async function logGigVirtualTabExpense(
  userId: string,
  input: {
    tabId: string;
    amount: number;
    category: string;
    note?: string | null;
    idempotencyKey: string;
  },
): Promise<GigVirtualTabDto> {
  return (await fetchMutation(api.gig.logVirtualTabExpense, {
    serverKey: serverKey(),
    userId,
    tabId: input.tabId,
    amount: input.amount,
    category: input.category,
    ...(input.note ? { note: input.note } : {}),
    idempotencyKey: input.idempotencyKey,
  })) as GigVirtualTabDto;
}

export async function getGigBundle(
  userId: string,
): Promise<GigBundleDto | null> {
  return (await fetchQuery(api.gig.getBundle, {
    serverKey: serverKey(),
    userId,
  })) as GigBundleDto | null;
}

export async function completeGigOnboarding(
  userId: string,
  input: {
    preferredName: string;
    city: string;
    preferredLanguage: string;
    workTypes: string[];
    primaryPriority: string;
    lowWeekIncome: number;
    typicalWeekIncome: number;
    goodWeekIncome: number;
    workDaysPerWeek: number;
    platformDeductionRate: number;
    weeklyWorkCosts: number;
    openingBalance: number;
    currentCushion: number;
    safetyBuffer: number;
    cushionTargetDays: number;
    trackingMode: "START_NOW" | "OBSERVE_LEARN";
    spendingProfile: {
      essentialCategories: string[];
      flexibleCategories: string[];
      hardestToProtect?: string | null;
    };
    sources: Array<{
      name: string;
      type: string;
      frequency: string;
      typicalMin: number;
      typicalMax: number;
      payoutDay?: number | null;
      nextPayoutAt?: string | null;
      connectionMode: string;
      prototype: boolean;
      dataTypes?: string[];
      purpose?: string | null;
      consentFrom?: string | null;
      consentTo?: string | null;
    }>;
    commitments: Array<{
      title: string;
      category: string;
      amount: number;
      dueDate: string;
      recurrence: string;
      essential: boolean;
      priority: number;
      autopay: boolean;
    }>;
    splitRule: {
      essentialsPct: number;
      workCostsPct: number;
      emergencyPct: number;
      longTermPct: number;
      flexiblePct: number;
      enabled: boolean;
    };
  },
): Promise<GigBundleDto | null> {
  return (await fetchMutation(api.gig.completeOnboarding, {
    serverKey: serverKey(),
    userId,
    ...input,
    sources: input.sources.map((source) => ({
      name: source.name,
      type: source.type,
      frequency: source.frequency,
      typicalMin: source.typicalMin,
      typicalMax: source.typicalMax,
      ...(source.payoutDay !== null && source.payoutDay !== undefined
        ? { payoutDay: source.payoutDay }
        : {}),
      ...(source.nextPayoutAt
        ? { nextPayoutAt: new Date(source.nextPayoutAt).getTime() }
        : {}),
      connectionMode: source.connectionMode,
      prototype: source.prototype,
      ...(source.dataTypes ? { dataTypes: source.dataTypes } : {}),
      ...(source.purpose ? { purpose: source.purpose } : {}),
      ...(source.consentFrom
        ? { consentFrom: new Date(source.consentFrom).getTime() }
        : {}),
      ...(source.consentTo
        ? { consentTo: new Date(source.consentTo).getTime() }
        : {}),
    })),
    commitments: input.commitments.map((commitment) => ({
      ...commitment,
      dueDate: new Date(commitment.dueDate).getTime(),
    })),
  })) as GigBundleDto | null;
}

export async function createGigEntry(
  userId: string,
  input: {
    kind: string;
    amount: number;
    sourceId?: string | null;
    sourceName?: string | null;
    category: string;
    paymentMethod: string;
    note?: string | null;
    workRelated: boolean;
    recurring?: boolean;
    status: string;
    date: string;
  },
): Promise<CashEntryDto> {
  return (await fetchMutation(api.gig.createEntry, {
    serverKey: serverKey(),
    userId,
    kind: input.kind,
    amount: input.amount,
    ...(input.sourceId ? { sourceId: input.sourceId } : {}),
    ...(input.sourceName ? { sourceName: input.sourceName } : {}),
    category: input.category,
    paymentMethod: input.paymentMethod,
    ...(input.note ? { note: input.note } : {}),
    workRelated: input.workRelated,
    recurring: input.recurring ?? false,
    status: input.status,
    date: new Date(input.date).getTime(),
  })) as CashEntryDto;
}

export async function updateGigEntry(
  userId: string,
  id: string,
  input: {
    kind: string;
    amount: number;
    sourceId?: string | null;
    sourceName?: string | null;
    category: string;
    paymentMethod: string;
    note?: string | null;
    workRelated: boolean;
    recurring?: boolean;
    status: string;
    date: string;
  },
): Promise<CashEntryDto | null> {
  return (await fetchMutation(api.gig.updateEntry, {
    serverKey: serverKey(),
    userId,
    id,
    kind: input.kind,
    amount: input.amount,
    ...(input.sourceId ? { sourceId: input.sourceId } : {}),
    ...(input.sourceName ? { sourceName: input.sourceName } : {}),
    category: input.category,
    paymentMethod: input.paymentMethod,
    ...(input.note ? { note: input.note } : {}),
    workRelated: input.workRelated,
    recurring: input.recurring ?? false,
    status: input.status,
    date: new Date(input.date).getTime(),
  })) as CashEntryDto | null;
}

export async function deleteGigEntry(userId: string, id: string) {
  return await fetchMutation(api.gig.deleteEntry, {
    serverKey: serverKey(),
    userId,
    id,
  });
}

export async function createGigSource(
  userId: string,
  source: {
    name: string;
    type: string;
    frequency: string;
    typicalMin: number;
    typicalMax: number;
    payoutDay?: number | null;
    nextPayoutAt?: string | null;
    connectionMode: string;
    prototype: boolean;
    dataTypes?: string[];
    purpose?: string | null;
    consentFrom?: string | null;
    consentTo?: string | null;
  },
): Promise<GigIncomeSourceDto> {
  return (await fetchMutation(api.gig.createSource, {
    serverKey: serverKey(),
    userId,
    source: {
      name: source.name,
      type: source.type,
      frequency: source.frequency,
      typicalMin: source.typicalMin,
      typicalMax: source.typicalMax,
      ...(source.payoutDay !== null && source.payoutDay !== undefined
        ? { payoutDay: source.payoutDay }
        : {}),
      ...(source.nextPayoutAt
        ? { nextPayoutAt: new Date(source.nextPayoutAt).getTime() }
        : {}),
      connectionMode: source.connectionMode,
      prototype: source.prototype,
      ...(source.dataTypes ? { dataTypes: source.dataTypes } : {}),
      ...(source.purpose ? { purpose: source.purpose } : {}),
      ...(source.consentFrom
        ? { consentFrom: new Date(source.consentFrom).getTime() }
        : {}),
      ...(source.consentTo
        ? { consentTo: new Date(source.consentTo).getTime() }
        : {}),
    },
  })) as GigIncomeSourceDto;
}

export async function updateGigSourceStatus(
  userId: string,
  id: string,
  status: string,
): Promise<GigIncomeSourceDto | null> {
  return (await fetchMutation(api.gig.updateSourceStatus, {
    serverKey: serverKey(),
    userId,
    id,
    status,
  })) as GigIncomeSourceDto | null;
}
export async function refreshGigSource(
  userId: string,
  id: string,
): Promise<GigIncomeSourceDto | null> {
  return (await fetchMutation(api.gig.refreshSource, {
    serverKey: serverKey(),
    userId,
    id,
  })) as GigIncomeSourceDto | null;
}

export async function createGigCommitment(
  userId: string,
  commitment: {
    title: string;
    category: string;
    amount: number;
    dueDate: string;
    recurrence: string;
    essential: boolean;
    priority: number;
    autopay: boolean;
  },
): Promise<CommitmentDto> {
  return (await fetchMutation(api.gig.createCommitment, {
    serverKey: serverKey(),
    userId,
    commitment: {
      ...commitment,
      dueDate: new Date(commitment.dueDate).getTime(),
    },
  })) as CommitmentDto;
}

export async function updateGigCommitment(
  userId: string,
  input: { id: string; dueDate?: string; amount?: number; status?: string },
): Promise<CommitmentDto | null> {
  return (await fetchMutation(api.gig.updateCommitment, {
    serverKey: serverKey(),
    userId,
    id: input.id,
    ...(input.dueDate ? { dueDate: new Date(input.dueDate).getTime() } : {}),
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
    ...(input.status ? { status: input.status } : {}),
  })) as CommitmentDto | null;
}
export async function markGigCommitmentPaid(
  userId: string,
  id: string,
  paidAt: string,
): Promise<CommitmentDto | null> {
  return (await fetchMutation(api.gig.markCommitmentPaid, {
    serverKey: serverKey(),
    userId,
    id,
    paidAt: new Date(paidAt).getTime(),
  })) as CommitmentDto | null;
}
export async function deleteGigCommitment(userId: string, id: string) {
  return await fetchMutation(api.gig.deleteCommitment, {
    serverKey: serverKey(),
    userId,
    id,
  });
}

export async function applyGigPayoutSplit(
  userId: string,
  input: {
    sourceId?: string | null;
    sourceName: string;
    amount: number;
    receivedAt: string;
    note?: string | null;
    percentages: {
      essentialsPct: number;
      workCostsPct: number;
      emergencyPct: number;
      longTermPct: number;
      flexiblePct: number;
    };
    allocationMode?: "ADAPTIVE" | "CUSTOM";
    beforeSafeAmount?: number;
    afterSafeAmount?: number;
    beforeProtectedDays?: number;
    afterProtectedDays?: number;
    fundedCommitmentIds?: string[];
    recommendationReason?: string;
  },
): Promise<PayoutSplitDto> {
  return (await fetchMutation(api.gig.applyPayoutSplit, {
    serverKey: serverKey(),
    userId,
    ...(input.sourceId ? { sourceId: input.sourceId } : {}),
    sourceName: input.sourceName,
    amount: input.amount,
    receivedAt: new Date(input.receivedAt).getTime(),
    ...(input.note ? { note: input.note } : {}),
    ...(input.allocationMode ? { allocationMode: input.allocationMode } : {}),
    ...(input.beforeSafeAmount !== undefined
      ? { beforeSafeAmount: input.beforeSafeAmount }
      : {}),
    ...(input.afterSafeAmount !== undefined
      ? { afterSafeAmount: input.afterSafeAmount }
      : {}),
    ...(input.beforeProtectedDays !== undefined
      ? { beforeProtectedDays: input.beforeProtectedDays }
      : {}),
    ...(input.afterProtectedDays !== undefined
      ? { afterProtectedDays: input.afterProtectedDays }
      : {}),
    ...(input.fundedCommitmentIds
      ? { fundedCommitmentIds: input.fundedCommitmentIds }
      : {}),
    ...(input.recommendationReason
      ? { recommendationReason: input.recommendationReason }
      : {}),
    percentages: input.percentages,
  })) as PayoutSplitDto;
}

export async function updateGigSettings(
  userId: string,
  input: {
    preferredName?: string;
    city?: string;
    preferredLanguage?: string;
    safetyBuffer?: number;
    cushionTargetDays?: number;
    splitRule?: {
      essentialsPct: number;
      workCostsPct: number;
      emergencyPct: number;
      longTermPct: number;
      flexiblePct: number;
      enabled: boolean;
    };
  },
): Promise<GigBundleDto | null> {
  return (await fetchMutation(api.gig.updateSettings, {
    serverKey: serverKey(),
    userId,
    ...input,
  })) as GigBundleDto | null;
}

export async function getGigPreferences(
  userId: string,
): Promise<GigPreferencesDto> {
  return (await fetchQuery(api.gig.getPreferences, {
    serverKey: serverKey(),
    userId,
  })) as GigPreferencesDto;
}

export async function updateGigPreferences(
  userId: string,
  preferences: Omit<GigPreferencesDto, "userId" | "updatedAt">,
): Promise<GigPreferencesDto> {
  return (await fetchMutation(api.gig.updatePreferences, {
    serverKey: serverKey(),
    userId,
    preferences,
  })) as GigPreferencesDto;
}

export async function getGigNotificationStates(
  userId: string,
): Promise<GigNotificationStateDto[]> {
  return (await fetchQuery(api.gig.getNotificationStates, {
    serverKey: serverKey(),
    userId,
  })) as GigNotificationStateDto[];
}

export async function updateGigNotificationState(
  userId: string,
  input: { key: string; action: string; snoozedUntil?: string },
): Promise<GigNotificationStateDto | null> {
  return (await fetchMutation(api.gig.updateNotificationState, {
    serverKey: serverKey(),
    userId,
    key: input.key,
    action: input.action,
    ...(input.snoozedUntil
      ? { snoozedUntil: new Date(input.snoozedUntil).getTime() }
      : {}),
  })) as GigNotificationStateDto | null;
}

export async function recordGigOutcome(
  userId: string,
  input: { type: string; value?: number; metadata?: string },
): Promise<string> {
  return (await fetchMutation(api.gig.recordOutcome, {
    serverKey: serverKey(),
    userId,
    ...input,
  })) as string;
}

export async function getGigPartnerMetrics(
  input: { from?: string; to?: string; city?: string; workType?: string } = {},
): Promise<GigPartnerMetricsDto> {
  return (await fetchQuery(api.gig.getPartnerMetrics, {
    serverKey: serverKey(),
    ...(input.from ? { from: new Date(input.from).getTime() } : {}),
    ...(input.to ? { to: new Date(input.to).getTime() } : {}),
    ...(input.city ? { city: input.city } : {}),
    ...(input.workType ? { workType: input.workType } : {}),
  })) as GigPartnerMetricsDto;
}
