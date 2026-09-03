import { NextRequest, NextResponse } from "next/server";
import { virtualTabExpenseInputSchema } from "@superfinz/shared";
import { getSession } from "@/lib/auth";
import { logGigVirtualTabExpense } from "@/lib/gig-store";

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = virtualTabExpenseInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid tab expense" },
      { status: 400 },
    );
  try {
    const tab = await logGigVirtualTabExpense(session.userId, parsed.data);
    return NextResponse.json({ tab });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not log expense" },
      { status: 409 },
    );
  }
}