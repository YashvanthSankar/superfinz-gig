import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listBudgets, upsertBudget } from "@/lib/convex-store";
import { z } from "zod";

const upsertSchema = z.object({
  category: z.string().min(1),
  limit: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
});

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const budgets = await listBudgets(session.userId, month, year);

  return NextResponse.json({ budgets });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { category, limit, month, year } = parsed.data;

  const budget = await upsertBudget({ userId: session.userId, category, limit, month, year });

  return NextResponse.json({ budget });
}
