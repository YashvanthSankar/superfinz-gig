import { NextRequest, NextResponse } from "next/server";
import { gigOnboardingSchema } from "@superfinz/shared";
import { getSession } from "@/lib/auth";
import { completeGigOnboarding } from "@/lib/gig-store";

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = gigOnboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid onboarding details" }, { status: 400 });
  const plan = await completeGigOnboarding(session.userId, parsed.data);
  return NextResponse.json({ plan }, { status: 201 });
}
