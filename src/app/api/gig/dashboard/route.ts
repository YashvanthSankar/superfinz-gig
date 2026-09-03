import { NextRequest, NextResponse } from "next/server";
import { calculateGigDashboard } from "@superfinz/shared";
import { getSession } from "@/lib/auth";
import { getGigBundle, recordGigOutcome } from "@/lib/gig-store";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bundle = await getGigBundle(session.userId);
  if (!bundle)
    return NextResponse.json(
      { error: "Complete gig-worker onboarding first" },
      { status: 409 },
    );
  const dashboard = calculateGigDashboard(bundle);
  await recordGigOutcome(session.userId, {
    type: "SAFE_TO_SPEND_CHECKED",
    value: dashboard.summary.safeToSpend,
  });
  return NextResponse.json({ dashboard });
}
