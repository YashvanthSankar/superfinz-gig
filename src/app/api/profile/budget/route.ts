import { getSession } from "@/lib/auth";
import { patchUserProfile } from "@/lib/convex-store";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  budget: z.number().min(0).max(10_000_000),
});

export async function PATCH(req: Request) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
  }

  try {
    const updated = await patchUserProfile(session.userId, { monthlyBudget: parsed.data.budget });
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
