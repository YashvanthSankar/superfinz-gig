import { NextRequest, NextResponse } from "next/server";
import { splitRuleInputSchema } from "@superfinz/shared";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getGigBundle, updateGigSettings } from "@/lib/gig-store";

const schema = z.object({ preferredName: z.string().trim().min(1).max(80).optional(), city: z.string().trim().min(1).max(80).optional(), preferredLanguage: z.string().trim().min(2).max(40).optional(), safetyBuffer: z.number().nonnegative().max(100_000_000).optional(), cushionTargetDays: z.number().int().min(7).max(180).optional(), splitRule: splitRuleInputSchema.optional() });
export async function GET(request: NextRequest) { const session = await getSession(request); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const bundle = await getGigBundle(session.userId); return bundle ? NextResponse.json({ profile: bundle.profile, splitRule: bundle.splitRule, sources: bundle.sources }) : NextResponse.json({ error: "Complete onboarding first" }, { status: 409 }); }
export async function PATCH(request: NextRequest) { const session = await getSession(request); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings" }, { status: 400 }); const bundle = await updateGigSettings(session.userId, parsed.data); return NextResponse.json({ profile: bundle?.profile, splitRule: bundle?.splitRule }); }
