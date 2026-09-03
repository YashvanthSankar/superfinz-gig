import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { recordGigOutcome } from "@/lib/gig-store";

const schema = z.object({
  type: z.enum([
    "SAFE_TO_SPEND_CHECKED",
    "SCENARIO_TESTED",
    "RECOMMENDED_ACTION_COMPLETED",
    "SHORTFALL_RESOLVED_WITHOUT_CREDIT",
    "CREDIT_AVOIDED",
    "COACH_FEEDBACK_HELPFUL",
    "COACH_FEEDBACK_NOT_HELPFUL",
  ]),
  value: z.number().finite().optional(),
  metadata: z.string().trim().max(300).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid outcome event" },
      { status: 400 },
    );
  const id = await recordGigOutcome(session.userId, parsed.data);
  return NextResponse.json({ id }, { status: 201 });
}
