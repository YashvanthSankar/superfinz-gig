import { NextRequest, NextResponse } from "next/server";
import { calculateGigDashboard } from "@superfinz/shared";
import { getSession } from "@/lib/auth";
import { getGigBundle } from "@/lib/gig-store";

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
  return NextResponse.json({ dashboard });
}
