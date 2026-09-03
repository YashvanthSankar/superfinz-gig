import { existsSync } from "node:fs";
import process from "node:process";
import { ConvexHttpClient } from "convex/browser";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { api } from "../convex/_generated/api";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

function required(value: string | undefined, message: string): string {
  if (!value) throw new Error(message);
  return value;
}

const databaseUrl = required(
  process.env.DATABASE_URL ?? process.env.DIRECT_URL,
  "Set DATABASE_URL (or DIRECT_URL) before running the migration.",
);
const convexUrl = required(process.env.NEXT_PUBLIC_CONVEX_URL, "NEXT_PUBLIC_CONVEX_URL is not configured.");
const serverKey = required(process.env.SUPERFINZ_SERVER_KEY, "SUPERFINZ_SERVER_KEY is not configured.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
} as ConstructorParameters<typeof PrismaClient>[0]);
const convex = new ConvexHttpClient(convexUrl);
const batchSize = 100;

async function importBatches<T>(
  label: string,
  records: T[],
  send: (records: T[], replace: boolean) => Promise<number>,
) {
  if (records.length === 0) {
    await send([], true);
    console.log(`${label}: 0`);
    return;
  }
  for (let offset = 0; offset < records.length; offset += batchSize) {
    await send(records.slice(offset, offset + batchSize), offset === 0);
  }
  console.log(`${label}: ${records.length}`);
}

async function main() {
  const [users, profiles, transactions, budgets, goals] = await Promise.all([
    prisma.user.findMany(),
    prisma.profile.findMany(),
    prisma.transaction.findMany(),
    prisma.budget.findMany(),
    prisma.goal.findMany(),
  ]);

  await importBatches("users", users.map((user) => ({
    externalId: user.id,
    email: user.email.toLowerCase(),
    ...(user.googleId ? { googleId: user.googleId } : {}),
    ...(user.avatar ? { avatar: user.avatar } : {}),
    name: user.name,
    age: user.age,
    userType: user.userType,
    onboarded: user.onboarded,
    createdAt: user.createdAt.getTime(),
    updatedAt: user.updatedAt.getTime(),
  })), (records, replace) => convex.mutation(api.migrations.importUsers, { serverKey, replace, records }));

  await importBatches("profiles", profiles.map((profile) => ({
    externalId: profile.id,
    userId: profile.userId,
    ...(profile.institution ? { institution: profile.institution } : {}),
    ...(profile.monthlyAllowance !== null ? { monthlyAllowance: profile.monthlyAllowance } : {}),
    incomeSources: profile.incomeSources,
    ...(profile.company ? { company: profile.company } : {}),
    ...(profile.monthlySalary !== null ? { monthlySalary: profile.monthlySalary } : {}),
    ...(profile.industry ? { industry: profile.industry } : {}),
    monthlyBudget: profile.monthlyBudget,
    savingsGoal: profile.savingsGoal,
    currency: profile.currency,
    spendingPattern: profile.spendingPattern,
    cycleStartDate: profile.cycleStartDate,
    createdAt: profile.createdAt.getTime(),
    updatedAt: profile.updatedAt.getTime(),
  })), (records, replace) => convex.mutation(api.migrations.importProfiles, { serverKey, replace, records }));

  await importBatches("transactions", transactions.map((transaction) => ({
    externalId: transaction.id,
    userId: transaction.userId,
    amount: transaction.amount,
    category: transaction.category,
    description: transaction.description,
    ...(transaction.isNecessary !== null ? { isNecessary: transaction.isNecessary } : {}),
    ...(transaction.aiNote ? { aiNote: transaction.aiNote } : {}),
    date: transaction.date.getTime(),
    createdAt: transaction.createdAt.getTime(),
  })), (records, replace) => convex.mutation(api.migrations.importTransactions, { serverKey, replace, records }));

  await importBatches("budgets", budgets.map((budget) => ({
    externalId: budget.id,
    userId: budget.userId,
    category: budget.category,
    limit: budget.limit,
    month: budget.month,
    year: budget.year,
    spent: budget.spent,
  })), (records, replace) => convex.mutation(api.migrations.importBudgets, { serverKey, replace, records }));

  await importBatches("goals", goals.map((goal) => ({
    externalId: goal.id,
    userId: goal.userId,
    title: goal.title,
    targetAmount: goal.targetAmount,
    savedAmount: goal.savedAmount,
    ...(goal.deadline ? { deadline: goal.deadline.getTime() } : {}),
    achieved: goal.achieved,
    isEssential: goal.isEssential,
    createdAt: goal.createdAt.getTime(),
  })), (records, replace) => convex.mutation(api.migrations.importGoals, { serverKey, replace, records }));

  console.log("Migration complete. Mobile refresh sessions were intentionally not copied; users sign in again securely.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
