import { NextRequest, NextResponse } from "next/server";
import { cashEntryInputSchema } from "@superfinz/shared";
import { getSession } from "@/lib/auth";
import { deleteGigEntry, updateGigEntry } from "@/lib/gig-store";

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/gig/entries/[id]">,
) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = cashEntryInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid entry" },
      { status: 400 },
    );
  const { id } = await context.params;
  const entry = await updateGigEntry(session.userId, id, parsed.data);
  return entry
    ? NextResponse.json({ entry })
    : NextResponse.json({ error: "Entry not found" }, { status: 404 });
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/gig/entries/[id]">,
) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const deleted = await deleteGigEntry(session.userId, id);
  return deleted
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Entry not found" }, { status: 404 });
}
