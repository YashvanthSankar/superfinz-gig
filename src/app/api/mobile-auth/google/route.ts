import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";
import { mobileGoogleAuthSchema } from "@superfinz/shared";
import { prisma } from "@/lib/prisma";
import { createMobileSession } from "@/lib/mobile-auth";
import { toUserDto } from "@/lib/dto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = mobileGoogleAuthSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const audience = process.env.GOOGLE_CLIENT_ID;
  if (!audience) return NextResponse.json({ error: "Google sign-in is not configured" }, { status: 503 });

  try {
    const ticket = await new OAuth2Client().verifyIdToken({ idToken: parsed.data.idToken, audience });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return NextResponse.json({ error: "Google account could not be verified" }, { status: 401 });
    }

    const user = await prisma.user.upsert({
      where: { email: payload.email },
      update: { googleId: payload.sub, avatar: payload.picture, name: payload.name ?? payload.email },
      create: { email: payload.email, googleId: payload.sub, avatar: payload.picture, name: payload.name ?? payload.email },
      include: { profile: true },
    });
    const tokens = await createMobileSession(user.id, parsed.data.deviceLabel);
    return NextResponse.json({ ...tokens, user: toUserDto(user) });
  } catch (error) {
    console.warn("[mobile-auth] Google token rejected", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Invalid Google credential" }, { status: 401 });
  }
}
