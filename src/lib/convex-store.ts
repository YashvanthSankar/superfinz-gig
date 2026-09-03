import "server-only";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import type {
  Budget,
  Goal,
  Profile,
  Transaction,
  User,
  UserWithProfile,
} from "@/types";

type ProfileWire = Omit<Profile, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type UserWire = Omit<User, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
  profile: ProfileWire | null;
};

type TransactionWire = Omit<Transaction, "date" | "createdAt"> & {
  date: string;
  createdAt: string;
};

type GoalWire = Omit<Goal, "deadline" | "createdAt"> & {
  deadline: string | null;
  createdAt: string;
};

export type MobileSessionRecord = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  deviceLabel: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  user: UserWithProfile;
};

function serverKey() {
  const value = process.env.SUPERFINZ_SERVER_KEY;
  if (!value) throw new Error("SUPERFINZ_SERVER_KEY is not configured");
  return value;
}

function hydrateProfile(profile: ProfileWire): Profile {
  return {
    ...profile,
    createdAt: new Date(profile.createdAt),
    updatedAt: new Date(profile.updatedAt),
  };
}

function hydrateUser(user: UserWire): UserWithProfile {
  return {
    ...user,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
    profile: user.profile ? hydrateProfile(user.profile) : null,
  };
}

function hydrateTransaction(transaction: TransactionWire): Transaction {
  return {
    ...transaction,
    date: new Date(transaction.date),
    createdAt: new Date(transaction.createdAt),
  };
}

function hydrateGoal(goal: GoalWire): Goal {
  return {
    ...goal,
    deadline: goal.deadline ? new Date(goal.deadline) : null,
    createdAt: new Date(goal.createdAt),
  };
}

export async function getUserById(id: string): Promise<UserWithProfile | null> {
  const user = await fetchQuery(api.superfinz.getUser, { serverKey: serverKey(), id });
  return user ? hydrateUser(user) : null;
}

export async function getUserByEmail(email: string): Promise<UserWithProfile | null> {
  const user = await fetchQuery(api.superfinz.getUser, { serverKey: serverKey(), email });
  return user ? hydrateUser(user) : null;
}

export async function upsertGoogleUser(input: {
  email: string;
  googleId: string;
  name: string;
  avatar?: string;
}): Promise<UserWithProfile> {
  const args = {
    serverKey: serverKey(),
    email: input.email,
    googleId: input.googleId,
    name: input.name,
    ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
  };
  const user = await fetchMutation(api.superfinz.upsertGoogleUser, args);
  return hydrateUser(user);
}

export async function completeUserProfile(input: {
  userId: string;
  age: number;
  userType: "SCHOOL_STUDENT" | "COLLEGE_STUDENT" | "PROFESSIONAL";
  institution?: string;
  monthlyAllowance?: number;
  incomeSources: string[];
  company?: string;
  monthlySalary?: number;
  industry?: string;
  monthlyBudget: number;
  savingsGoal: number;
  spendingPattern: string;
  cycleStartDate: number;
}) {
  return await fetchMutation(api.superfinz.completeProfile, {
    serverKey: serverKey(),
    userId: input.userId,
    age: input.age,
    userType: input.userType,
    incomeSources: input.incomeSources,
    monthlyBudget: input.monthlyBudget,
    savingsGoal: input.savingsGoal,
    spendingPattern: input.spendingPattern,
    cycleStartDate: input.cycleStartDate,
    ...(input.institution !== undefined ? { institution: input.institution } : {}),
    ...(input.monthlyAllowance !== undefined ? { monthlyAllowance: input.monthlyAllowance } : {}),
    ...(input.company !== undefined ? { company: input.company } : {}),
    ...(input.monthlySalary !== undefined ? { monthlySalary: input.monthlySalary } : {}),
    ...(input.industry !== undefined ? { industry: input.industry } : {}),
  });
}

export type ProfilePatch = {
  monthlyBudget?: number;
  savingsGoal?: number;
  monthlyAllowance?: number;
  monthlySalary?: number;
  institution?: string;
  company?: string;
  industry?: string;
};

export async function patchUserProfile(userId: string, patch: ProfilePatch) {
  return await fetchMutation(api.superfinz.patchProfile, {
    serverKey: serverKey(),
    userId,
    ...(patch.monthlyBudget !== undefined ? { monthlyBudget: patch.monthlyBudget } : {}),
    ...(patch.savingsGoal !== undefined ? { savingsGoal: patch.savingsGoal } : {}),
    ...(patch.monthlyAllowance !== undefined ? { monthlyAllowance: patch.monthlyAllowance } : {}),
    ...(patch.monthlySalary !== undefined ? { monthlySalary: patch.monthlySalary } : {}),
    ...(patch.institution !== undefined ? { institution: patch.institution } : {}),
    ...(patch.company !== undefined ? { company: patch.company } : {}),
    ...(patch.industry !== undefined ? { industry: patch.industry } : {}),
  });
}

export async function createSessionRecord(input: {
  userId: string;
  refreshTokenHash: string;
  deviceLabel?: string;
  expiresAt: Date;
}) {
  return await fetchMutation(api.superfinz.createMobileSession, {
    serverKey: serverKey(),
    userId: input.userId,
    refreshTokenHash: input.refreshTokenHash,
    ...(input.deviceLabel !== undefined ? { deviceLabel: input.deviceLabel } : {}),
    expiresAt: input.expiresAt.getTime(),
  });
}

export async function getSessionById(id: string): Promise<MobileSessionRecord | null> {
  const session = await fetchQuery(api.superfinz.getMobileSession, { serverKey: serverKey(), id });
  return session ? {
    ...session,
    expiresAt: new Date(session.expiresAt),
    revokedAt: session.revokedAt ? new Date(session.revokedAt) : null,
    user: hydrateUser(session.user),
  } : null;
}

export async function getSessionByRefreshHash(refreshTokenHash: string): Promise<MobileSessionRecord | null> {
  const session = await fetchQuery(api.superfinz.getMobileSession, {
    serverKey: serverKey(),
    refreshTokenHash,
  });
  return session ? {
    ...session,
    expiresAt: new Date(session.expiresAt),
    revokedAt: session.revokedAt ? new Date(session.revokedAt) : null,
    user: hydrateUser(session.user),
  } : null;
}

export async function rotateSessionRecord(input: {
  id: string;
  oldRefreshTokenHash: string;
  newRefreshTokenHash: string;
  expiresAt: Date;
}) {
  return await fetchMutation(api.superfinz.rotateMobileSession, {
    serverKey: serverKey(),
    id: input.id,
    oldRefreshTokenHash: input.oldRefreshTokenHash,
    newRefreshTokenHash: input.newRefreshTokenHash,
    expiresAt: input.expiresAt.getTime(),
  });
}

export async function revokeSessionByRefreshHash(refreshTokenHash: string) {
  return await fetchMutation(api.superfinz.revokeMobileSession, {
    serverKey: serverKey(),
    refreshTokenHash,
  });
}

export async function listTransactions(input: {
  userId: string;
  startInclusive?: Date;
  endExclusive?: Date;
  category?: string;
  excludeId?: string;
  offset?: number;
  limit?: number;
  descending?: boolean;
}): Promise<{ transactions: Transaction[]; total: number }> {
  const result = await fetchQuery(api.superfinz.listTransactions, {
    serverKey: serverKey(),
    userId: input.userId,
    ...(input.startInclusive ? { startInclusive: input.startInclusive.getTime() } : {}),
    ...(input.endExclusive ? { endExclusive: input.endExclusive.getTime() } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.excludeId !== undefined ? { excludeId: input.excludeId } : {}),
    ...(input.offset !== undefined ? { offset: input.offset } : {}),
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
    ...(input.descending !== undefined ? { descending: input.descending } : {}),
  });
  return {
    transactions: result.transactions.map(hydrateTransaction),
    total: result.total,
  };
}

export async function createTransaction(input: {
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
}): Promise<Transaction> {
  const transaction = await fetchMutation(api.superfinz.createTransaction, {
    serverKey: serverKey(),
    ...input,
    date: input.date.getTime(),
  });
  return hydrateTransaction(transaction);
}

export async function deleteTransaction(userId: string, id: string) {
  return await fetchMutation(api.superfinz.deleteTransaction, {
    serverKey: serverKey(),
    userId,
    id,
  });
}

export async function annotateTransaction(input: {
  userId: string;
  id: string;
  isNecessary: boolean;
  aiNote: string;
}) {
  return await fetchMutation(api.superfinz.annotateTransaction, {
    serverKey: serverKey(),
    ...input,
  });
}

export async function listBudgets(userId: string, month: number, year: number): Promise<Budget[]> {
  return await fetchQuery(api.superfinz.listBudgets, {
    serverKey: serverKey(),
    userId,
    month,
    year,
  });
}

export async function getCategoryBudget(userId: string, category: string, month: number, year: number): Promise<Budget | null> {
  return await fetchQuery(api.superfinz.getBudget, {
    serverKey: serverKey(),
    userId,
    category,
    month,
    year,
  });
}

export async function upsertBudget(input: {
  userId: string;
  category: string;
  limit: number;
  month: number;
  year: number;
}): Promise<Budget> {
  return await fetchMutation(api.superfinz.upsertBudget, {
    serverKey: serverKey(),
    ...input,
  });
}

export async function listGoals(
  userId: string,
  options: { includeAchieved?: boolean; limit?: number } = {},
): Promise<Goal[]> {
  const goals = await fetchQuery(api.superfinz.listGoals, {
    serverKey: serverKey(),
    userId,
    ...(options.includeAchieved !== undefined ? { includeAchieved: options.includeAchieved } : {}),
    ...(options.limit !== undefined ? { limit: options.limit } : {}),
  });
  return goals.map(hydrateGoal);
}

export async function createGoal(input: {
  userId: string;
  title: string;
  targetAmount: number;
  deadline?: Date;
  isEssential: boolean;
}): Promise<Goal> {
  const goal = await fetchMutation(api.superfinz.createGoal, {
    serverKey: serverKey(),
    userId: input.userId,
    title: input.title,
    targetAmount: input.targetAmount,
    ...(input.deadline ? { deadline: input.deadline.getTime() } : {}),
    isEssential: input.isEssential,
  });
  return hydrateGoal(goal);
}

export async function updateGoal(input: {
  userId: string;
  id: string;
  savedAmount?: number;
  achieved?: boolean;
}): Promise<Goal | null> {
  const goal = await fetchMutation(api.superfinz.updateGoal, {
    serverKey: serverKey(),
    userId: input.userId,
    id: input.id,
    ...(input.savedAmount !== undefined ? { savedAmount: input.savedAmount } : {}),
    ...(input.achieved !== undefined ? { achieved: input.achieved } : {}),
  });
  return goal ? hydrateGoal(goal) : null;
}

export async function applyGoalAllocations(input: {
  userId: string;
  allocations: Array<{ id: string; amount: number }>;
}): Promise<Goal[]> {
  const goals = await fetchMutation(api.superfinz.applyGoalAllocations, {
    serverKey: serverKey(),
    ...input,
  });
  return goals.map(hydrateGoal);
}
