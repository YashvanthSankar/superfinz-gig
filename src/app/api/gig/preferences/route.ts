import { NextRequest, NextResponse } from "next/server";
import { gigPreferencesInputSchema } from "@superfinz/shared";
import { getSession } from "@/lib/auth";
import { getGigPreferences, updateGigPreferences } from "@/lib/gig-store";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    preferences: await getGigPreferences(session.userId),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = gigPreferencesInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid preferences" },
      { status: 400 },
    );
  return NextResponse.json({
    preferences: await updateGigPreferences(session.userId, parsed.data),
  });
}
