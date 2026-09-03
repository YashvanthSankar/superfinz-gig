import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserById, patchUserProfile } from "@/lib/convex-store";
import { financePlanError } from "@/lib/finance";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserById(session.userId);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

const patchSchema = z.object({
  monthlyBudget:    z.number().min(0).optional(),
  savingsGoal:      z.number().min(0).optional(),
  monthlyAllowance: z.number().min(0).optional(),
  monthlySalary:    z.number().min(0).optional(),
  institution:      z.string().optional(),
  company:          z.string().optional(),
  industry:         z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existingUser = await getUserById(session.userId);

  if (!existingUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mergedMonthlyBudget = parsed.data.monthlyBudget ?? existingUser.profile?.monthlyBudget ?? 0;
  const mergedSavingsGoal = parsed.data.savingsGoal ?? existingUser.profile?.savingsGoal ?? 0;
  const mergedMonthlySalary = parsed.data.monthlySalary ?? existingUser.profile?.monthlySalary ?? 0;
  const mergedMonthlyAllowance = parsed.data.monthlyAllowance ?? existingUser.profile?.monthlyAllowance ?? 0;
  const mergedIncome = existingUser.userType === "PROFESSIONAL" ? mergedMonthlySalary : mergedMonthlyAllowance;

  const planError = financePlanError({
    monthlyIncome: mergedIncome,
    monthlyBudget: mergedMonthlyBudget,
    savingsGoal: mergedSavingsGoal,
  });

  if (planError) {
    return NextResponse.json({ error: planError }, { status: 400 });
  }

  await patchUserProfile(session.userId, parsed.data);

  return NextResponse.json({ success: true });
}
