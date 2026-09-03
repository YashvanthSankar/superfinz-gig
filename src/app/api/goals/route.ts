import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import { createGoal, listGoals, updateGoal } from "@/lib/convex-store";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(100),
  targetAmount: z.number().positive().max(100_000_000),
  deadline: z.string().optional(),
  isEssential: z.boolean().optional().default(false),
});

const updateSchema = z.object({
  id: z.string().min(1),
  savedAmount: z.number().min(0).max(100_000_000).optional(),
  achieved: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await listGoals(session.userId);

  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const goal = await createGoal({
    userId: session.userId,
    title: parsed.data.title,
    targetAmount: parsed.data.targetAmount,
    deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
    isEssential: parsed.data.isEssential,
  });

  revalidateTag(`dashboard-${session.userId}`, "default");
  return NextResponse.json({ goal }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;

  const updated = await updateGoal({ userId: session.userId, id, ...updates });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidateTag(`dashboard-${session.userId}`, "default");
  return NextResponse.json({ goal: updated });
}
