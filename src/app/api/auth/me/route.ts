import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/convex-store";
import { getGigBundle } from "@/lib/gig-store";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserById(session.userId);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const gigPlan = await getGigBundle(user.id);
  return NextResponse.json({ user: { ...user, onboarded: Boolean(gigPlan) } });
}
