import { NextRequest, NextResponse } from "next/server";
import { gigSourceInputSchema } from "@superfinz/shared";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  createGigSource,
  getGigBundle,
  refreshGigSource,
  updateGigSourceStatus,
} from "@/lib/gig-store";

const statusSchema = z
  .object({
    id: z.string().min(1),
    status: z.enum(["ACTIVE", "PAUSED", "REVOKED"]).optional(),
    action: z.literal("REFRESH").optional(),
  })
  .refine(
    (value) => Boolean(value.status || value.action),
    "Choose a source action",
  );

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bundle = await getGigBundle(session.userId);
  return NextResponse.json({ sources: bundle?.sources ?? [] });
}
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = gigSourceInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid source" },
      { status: 400 },
    );
  return NextResponse.json(
    { source: await createGigSource(session.userId, parsed.data) },
    { status: 201 },
  );
}
export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid source update" },
      { status: 400 },
    );
  const source =
    parsed.data.action === "REFRESH"
      ? await refreshGigSource(session.userId, parsed.data.id)
      : await updateGigSourceStatus(
          session.userId,
          parsed.data.id,
          parsed.data.status!,
        );
  return source
    ? NextResponse.json({ source })
    : NextResponse.json({ error: "Source not found" }, { status: 404 });
}
