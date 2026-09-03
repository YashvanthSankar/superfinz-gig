import { NextResponse } from "next/server";
import { refreshTokenSchema } from "@superfinz/shared";
import { revokeRefreshToken } from "@/lib/mobile-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = refreshTokenSchema.safeParse(await request.json().catch(() => null));
  if (parsed.success) await revokeRefreshToken(parsed.data.refreshToken);
  return NextResponse.json({ success: true });
}
