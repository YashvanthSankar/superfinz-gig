import { NextResponse } from "next/server";
import { refreshTokenSchema } from "@superfinz/shared";
import { rotateMobileSession } from "@/lib/mobile-auth";
import { toUserDto } from "@/lib/dto";
import { getGigBundle } from "@/lib/gig-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = refreshTokenSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const result = await rotateMobileSession(parsed.data.refreshToken);
  if (!result) return NextResponse.json({ error: "Session expired" }, { status: 401 });
  const { user, ...tokens } = result;
  const gigPlan = await getGigBundle(user.id);
  return NextResponse.json({ ...tokens, user: { ...toUserDto(user), onboarded: Boolean(gigPlan) } });
}
