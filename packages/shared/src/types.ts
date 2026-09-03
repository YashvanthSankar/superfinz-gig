export type UserType = "SCHOOL_STUDENT" | "COLLEGE_STUDENT" | "PROFESSIONAL";
export type IncomeSource = "PARENTS" | "SCHOLARSHIP" | "PART_TIME" | "SALARY" | "FREELANCE" | "OTHER";

export type ProfileDto = {
  id: string;
  userId: string;
  institution: string | null;
  monthlyAllowance: number | null;
  incomeSources: IncomeSource[];
  company: string | null;
  monthlySalary: number | null;
  industry: string | null;
  monthlyBudget: number;
  savingsGoal: number;
  currency: string;
  spendingPattern: string;
  cycleStartDate: number;
  createdAt: string;
  updatedAt: string;
};

export type UserDto = {
  id: string;
  email: string;
  avatar: string | null;
  name: string;
  age: number;
  userType: UserType;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
  profile: ProfileDto | null;
};

export type TransactionDto = {
  id: string; userId: string; amount: number; category: string; description: string;
  isNecessary: boolean | null; aiNote: string | null; date: string; createdAt: string;
};
export type BudgetDto = { id: string; userId: string; category: string; limit: number; month: number; year: number; spent: number };
export type GoalDto = { id: string; userId: string; title: string; targetAmount: number; savedAmount: number; deadline: string | null; achieved: boolean; isEssential: boolean; createdAt: string };
export type HeatmapPointDto = { date: string; total: number; count: number };

export type DashboardDto = {
  user: UserDto;
  summary: { income: number; spent: number; remaining: number; saved: number; savingsRate: number };
  cycle: { start: string; end: string; daysElapsed: number; daysTotal: number };
  categorySpending: Array<{ category: string; amount: number; color: string }>;
  weeklySpending: Array<{ week: string; spent: number; allowance: number }>;
  budgetAlerts: Array<{ category: string; spent: number; limit: number; percentage: number }>;
  recentTransactions: TransactionDto[];
  goals: GoalDto[];
};

export type AuthTokens = { accessToken: string; refreshToken: string; expiresIn: number };
export type AuthResponse = AuthTokens & { user: UserDto };
