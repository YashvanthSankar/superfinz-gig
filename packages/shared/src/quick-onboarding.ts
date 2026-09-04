import { z } from "zod";
import {
  COMMITMENT_RECURRENCES,
  GIG_PRIORITIES,
  GIG_SOURCE_TYPES,
  GIG_WORK_TYPES,
  gigOnboardingSchema,
  type CommitmentRecurrence,
  type GigPriority,
  type GigSourceType,
  type GigWorkType,
} from "./gig";

export const QUICK_SETUP_STAGES = [
  "ABOUT",
  "WORK",
  "INCOME",
  "COSTS",
  "MONEY",
  "BILLS",
  "PRIORITY",
  "REVIEW",
] as const;

export type QuickSetupStage = (typeof QUICK_SETUP_STAGES)[number];

export const QUICK_SETUP_AI_STAGES = [
  "ABOUT",
  "WORK",
  "INCOME",
  "COSTS",
  "MONEY",
  "BILLS",
] as const;

export const QUICK_SETUP_QUESTIONS: Record<
  Exclude<QuickSetupStage, "REVIEW">,
  { title: string; question: string; example?: string }
> = {
  ABOUT: {
    title: "About you",
    question: "What should I call you, and which city do you work in?",
    example: "For example: Ravi, Chennai",
  },
  WORK: {
    title: "Your work",
    question:
      "What gig work do you do, who usually pays you, and how many days a week do you work?",
    example: "For example: Zomato delivery, usually 6 days",
  },
  INCOME: {
    title: "Weekly income",
    question:
      "After app fees, what reaches you in a slow, normal and good week? You can also mention your next payout day.",
    example: "For example: ₹3,000, ₹6,000 and ₹9,000. Next payout is Friday",
  },
  COSTS: {
    title: "Work costs",
    question:
      "About how much do fuel, travel, mobile data, tools or supplies cost in one week?",
    example: "For example: around ₹1,200 a week, or say none",
  },
  MONEY: {
    title: "Money available",
    question:
      "How much money can you use today? If you already keep emergency savings, mention that too.",
    example: "For example: ₹5,000 available and ₹1,000 kept for emergencies",
  },
  BILLS: {
    title: "Bills and subscriptions",
    question:
      "What payments are coming up? Say the name, amount, due date, and whether each one is essential or non-essential.",
    example:
      "For example: Rent ₹6,000 on 10 September, essential; Netflix ₹649 on 15 September, non-essential",
  },
  PRIORITY: {
    title: "Your main goal",
    question: "What should your dashboard help with first?",
  },
};

export const QUICK_SETUP_STAGE_ORDER: QuickSetupStage[] = [
  ...QUICK_SETUP_STAGES,
];

export const QUICK_SETUP_WORK_LABELS: Record<GigWorkType, string> = {
  DELIVERY: "Delivery",
  RIDE_HAILING: "Driving / rides",
  HOME_SERVICES: "Home services",
  FREELANCE: "Freelance",
  STREET_VENDING: "Street vending",
  DAILY_WAGE: "Daily wage",
  DOMESTIC_WORK: "Domestic work",
  OTHER: "Other gig work",
};

export const QUICK_SETUP_PRIORITY_LABELS: Record<GigPriority, string> = {
  STABLE_WEEKLY_SPENDING: "Know what I can safely spend",
  EMERGENCY_CUSHION: "Build emergency savings",
  UPCOMING_BILLS: "Pay bills on time",
  WORK_EXPENSES: "Protect fuel and work costs",
  AVOIDING_DEBT: "Avoid borrowing for daily needs",
};

export const QUICK_SETUP_DASHBOARD_COPY: Record<
  GigPriority,
  { focus: string; introduction: string }
> = {
  STABLE_WEEKLY_SPENDING: {
    focus: "Safe spending",
    introduction: "Start with what you can safely use today.",
  },
  EMERGENCY_CUSHION: {
    focus: "Emergency savings",
    introduction: "Your emergency cover comes first in today’s plan.",
  },
  UPCOMING_BILLS: {
    focus: "Bills first",
    introduction: "Important bills are protected before flexible spending.",
  },
  WORK_EXPENSES: {
    focus: "Work costs first",
    introduction: "Fuel and work costs are protected so you can keep earning.",
  },
  AVOIDING_DEBT: {
    focus: "Avoid daily debt",
    introduction: "Daily needs are protected before flexible spending.",
  },
};

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const quickSetupCommitmentSchema = z.object({
  title: z.string().trim().min(1).max(80),
  amount: z.number().positive().max(100_000_000),
  dueDate: dateOnly,
  recurrence: z.enum(COMMITMENT_RECURRENCES),
  essential: z.boolean().default(true),
});

export type QuickSetupCommitment = z.infer<
  typeof quickSetupCommitmentSchema
>;

export const quickSetupDraftSchema = z.object({
  preferredName: z.string().trim().min(1).max(80).optional(),
  city: z.string().trim().min(1).max(80).optional(),
  preferredLanguage: z.string().trim().min(2).max(40).optional(),
  workTypes: z.array(z.enum(GIG_WORK_TYPES)).min(1).optional(),
  sourceName: z.string().trim().min(1).max(80).optional(),
  sourceType: z.enum(GIG_SOURCE_TYPES).optional(),
  workDaysPerWeek: z.number().int().min(1).max(7).optional(),
  lowWeekIncome: z.number().nonnegative().max(100_000_000).optional(),
  typicalWeekIncome: z.number().positive().max(100_000_000).optional(),
  goodWeekIncome: z.number().nonnegative().max(100_000_000).optional(),
  nextPayoutDate: dateOnly.optional(),
  weeklyWorkCosts: z.number().nonnegative().max(100_000_000).optional(),
  openingBalance: z.number().nonnegative().max(100_000_000).optional(),
  currentCushion: z.number().nonnegative().max(100_000_000).optional(),
  commitments: z.array(quickSetupCommitmentSchema).max(20).optional(),
  primaryPriority: z.enum(GIG_PRIORITIES).optional(),
});

export type QuickSetupDraft = z.infer<typeof quickSetupDraftSchema>;
export const quickSetupCompleteDraftSchema = quickSetupDraftSchema.required();

export const quickSetupAssistantRequestSchema = z.object({
  stage: z.enum(QUICK_SETUP_AI_STAGES),
  answer: z.string().trim().min(1).max(500),
});

export type QuickSetupAssistantRequest = z.infer<
  typeof quickSetupAssistantRequestSchema
>;

export type QuickSetupAssistantResponse = {
  accepted: boolean;
  confirmation: string;
  patch: QuickSetupDraft;
  assumptions: string[];
  source: "ai" | "safe-fallback";
};

export const QUICK_SETUP_SPLITS: Record<
  GigPriority,
  {
    essentialsPct: number;
    workCostsPct: number;
    emergencyPct: number;
    longTermPct: number;
    flexiblePct: number;
  }
> = {
  STABLE_WEEKLY_SPENDING: {
    essentialsPct: 55,
    workCostsPct: 15,
    emergencyPct: 10,
    longTermPct: 5,
    flexiblePct: 15,
  },
  EMERGENCY_CUSHION: {
    essentialsPct: 50,
    workCostsPct: 15,
    emergencyPct: 20,
    longTermPct: 5,
    flexiblePct: 10,
  },
  UPCOMING_BILLS: {
    essentialsPct: 65,
    workCostsPct: 15,
    emergencyPct: 10,
    longTermPct: 5,
    flexiblePct: 5,
  },
  WORK_EXPENSES: {
    essentialsPct: 50,
    workCostsPct: 25,
    emergencyPct: 10,
    longTermPct: 5,
    flexiblePct: 10,
  },
  AVOIDING_DEBT: {
    essentialsPct: 60,
    workCostsPct: 15,
    emergencyPct: 15,
    longTermPct: 5,
    flexiblePct: 5,
  },
};

export function quickSetupSafetyBuffer(typicalWeekIncome: number) {
  return Math.max(100, Math.round((typicalWeekIncome * 0.08) / 50) * 50);
}

export function quickSetupSourceType(
  workTypes: GigWorkType[],
): GigSourceType {
  if (workTypes.some((type) => ["DELIVERY", "RIDE_HAILING"].includes(type)))
    return "PLATFORM_PAYOUT";
  if (
    workTypes.some((type) =>
      ["STREET_VENDING", "DAILY_WAGE", "DOMESTIC_WORK"].includes(type),
    )
  )
    return "CASH";
  return "BANK_TRANSFER";
}

export function quickSetupRecurrence(
  value?: CommitmentRecurrence,
): CommitmentRecurrence {
  return value ?? "MONTHLY";
}

export function buildQuickOnboardingPayload(draft: QuickSetupDraft) {
  const complete = quickSetupCompleteDraftSchema.parse(draft);
  const split = QUICK_SETUP_SPLITS[complete.primaryPriority];
  return gigOnboardingSchema.parse({
    preferredName: complete.preferredName,
    city: complete.city,
    preferredLanguage: complete.preferredLanguage,
    workTypes: complete.workTypes,
    primaryPriority: complete.primaryPriority,
    lowWeekIncome: complete.lowWeekIncome,
    typicalWeekIncome: complete.typicalWeekIncome,
    goodWeekIncome: complete.goodWeekIncome,
    workDaysPerWeek: complete.workDaysPerWeek,
    platformDeductionRate: 0,
    weeklyWorkCosts: complete.weeklyWorkCosts,
    openingBalance: complete.openingBalance,
    currentCushion: complete.currentCushion,
    safetyBuffer: quickSetupSafetyBuffer(complete.typicalWeekIncome),
    cushionTargetDays: 30,
    sources: [
      {
        name: complete.sourceName,
        type: complete.sourceType,
        frequency: "WEEKLY",
        typicalMin: complete.lowWeekIncome,
        typicalMax: complete.goodWeekIncome,
        nextPayoutAt: new Date(
          `${complete.nextPayoutDate}T12:00:00`,
        ).toISOString(),
        connectionMode: "MANUAL",
        prototype: true,
      },
    ],
    commitments: complete.commitments.map((bill, index) => ({
      title: bill.title,
      category: bill.title.slice(0, 60),
      amount: bill.amount,
      dueDate: new Date(`${bill.dueDate}T12:00:00`).toISOString(),
      recurrence: bill.recurrence,
      essential: bill.essential,
      priority: bill.essential ? Math.min(index + 1, 3) : 5,
      autopay: false,
    })),
    splitRule: { ...split, enabled: true },
  });
}
