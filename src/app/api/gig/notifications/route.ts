import { NextRequest, NextResponse } from "next/server";
import {
  calculateGigDashboard,
  deriveGigNotifications,
  gigNotificationActionSchema,
} from "@superfinz/shared";
import { getSession } from "@/lib/auth";
import {
  getGigBundle,
  getGigNotificationStates,
  getGigPreferences,
  updateGigNotificationState,
} from "@/lib/gig-store";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [bundle, preferences, states] = await Promise.all([
    getGigBundle(session.userId),
    getGigPreferences(session.userId),
    getGigNotificationStates(session.userId),
  ]);
  if (!bundle)
    return NextResponse.json(
      { error: "Complete onboarding first" },
      { status: 409 },
    );
  const notifications = deriveGigNotifications(
    calculateGigDashboard(bundle),
    preferences,
    states,
  );
  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    preferences,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = gigNotificationActionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid notification action",
      },
      { status: 400 },
    );
  const state = await updateGigNotificationState(session.userId, parsed.data);
  return NextResponse.json({ state });
}
