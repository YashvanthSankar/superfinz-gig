import type { DashboardDto, GoalDto, TransactionDto, UserDto } from "@superfinz/shared";
import { categoryColor } from "@superfinz/shared";
import { getUserById, listBudgets, listGoals, listTransactions } from "@/lib/convex-store";
import { toUserDto } from "@/lib/dto";

const dayMs = 86_400_000;

export async function getDashboardData(userId: string): Promise<DashboardDto | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const now = new Date();
  const joinedThisMonth = user.createdAt.getFullYear() === now.getFullYear() && user.createdAt.getMonth() === now.getMonth();
  const start = new Date(now.getFullYear(), now.getMonth(), joinedThisMonth ? user.createdAt.getDate() : 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const [transactions, goals, budgets] = await Promise.all([
    listTransactions({ userId, startInclusive: start, endExclusive: end }).then((result) => result.transactions),
    listGoals(userId),
    listBudgets(userId, now.getMonth() + 1, now.getFullYear()),
  ]);

  const budget = user.profile?.monthlyBudget ?? 0;
  const income = user.profile?.monthlySalary ?? user.profile?.monthlyAllowance ?? 0;
  const spent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const categoryMap = new Map<string, number>();
  const weekMap = [0, 0, 0, 0, 0];
  for (const transaction of transactions) {
    categoryMap.set(transaction.category, (categoryMap.get(transaction.category) ?? 0) + transaction.amount);
    const day = Math.floor((transaction.date.getTime() - start.getTime()) / dayMs);
    weekMap[Math.min(4, Math.max(0, Math.floor(day / 7)))] += transaction.amount;
  }

  const pattern = user.profile?.spendingPattern ?? "BALANCED";
  const weights = pattern === "FRONT_HEAVY" ? [1.5, 1.2, 1, 0.8, 0.5] : pattern === "CONSERVATIVE" ? [0.5, 0.8, 1, 1.2, 1.5] : [1, 1, 1, 1, 1];
  const daysTotal = Math.round((end.getTime() - start.getTime()) / dayMs);
  weights[4] *= Math.max(0, daysTotal - 28) / 7;
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);

  const transactionDtos: TransactionDto[] = transactions.map((transaction) => ({
    ...transaction,
    date: transaction.date.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
  }));
  const goalDtos: GoalDto[] = goals.map((goal) => ({
    ...goal,
    deadline: goal.deadline?.toISOString() ?? null,
    createdAt: goal.createdAt.toISOString(),
  }));
  const userDto: UserDto = toUserDto(user);

  return {
    user: userDto,
    summary: {
      income,
      spent,
      remaining: budget - spent,
      saved: goals.reduce((sum, goal) => sum + goal.savedAmount, 0),
      savingsRate: income > 0 ? Math.max(0, ((income - spent) / income) * 100) : 0,
    },
    cycle: {
      start: start.toISOString(),
      end: end.toISOString(),
      daysElapsed: Math.min(daysTotal, Math.max(1, Math.floor((now.getTime() - start.getTime()) / dayMs) + 1)),
      daysTotal,
    },
    categorySpending: [...categoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount], index) => ({ category, amount, color: categoryColor(category, index) })),
    weeklySpending: weekMap.map((weekSpent, index) => ({
      week: `W${index + 1}`,
      spent: weekSpent,
      allowance: weightTotal > 0 ? (weights[index] / weightTotal) * budget : 0,
    })),
    budgetAlerts: budgets
      .filter((item) => item.limit > 0 && item.spent >= item.limit * 0.9)
      .map((item) => ({ category: item.category, spent: item.spent, limit: item.limit, percentage: Math.round((item.spent / item.limit) * 100) })),
    recentTransactions: transactionDtos.slice(-5).reverse(),
    goals: goalDtos,
  };
}
