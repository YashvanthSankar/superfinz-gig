import { NextRequest, NextResponse } from "next/server";
import { payoutSplitInputSchema } from "@superfinz/shared";
import { getSession } from "@/lib/auth";
import { applyGigPayoutSplit } from "@/lib/gig-store";

export async function POST(request: NextRequest) { const session = await getSession(request); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const parsed = payoutSplitInputSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payout split" }, { status: 400 }); const split = await applyGigPayoutSplit(session.userId, parsed.data); return NextResponse.json({ split }, { status: 201 }); }
