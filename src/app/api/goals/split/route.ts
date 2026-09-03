import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { applyGoalAllocations } from "@/lib/convex-store";

const schema = z.object({
  allocations: z.array(z.object({
    id: z.string().min(1),
    amount: z.number().positive().max(100_000_000),
  })).min(1).max(50),
});

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid allocations" }, { status: 400 });

  try {
    const goals = await applyGoalAllocations({ userId: session.userId, allocations: parsed.data.allocations });
    revalidateTag(`dashboard-${session.userId}`, "default");
    return NextResponse.json({ goals });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Could not apply split" }, { status: 400 });
  }
}
