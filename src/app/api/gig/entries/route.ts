import { NextRequest, NextResponse } from "next/server";
import { cashEntryInputSchema } from "@superfinz/shared";
import { getSession } from "@/lib/auth";
import { createGigEntry, getGigBundle } from "@/lib/gig-store";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bundle = await getGigBundle(session.userId);
  if (!bundle) return NextResponse.json({ error: "Complete onboarding first" }, { status: 409 });
  return NextResponse.json({ entries: bundle.entries, sources: bundle.sources });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = cashEntryInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid entry" }, { status: 400 });
  const entry = await createGigEntry(session.userId, parsed.data);
  return NextResponse.json({ entry }, { status: 201 });
}
