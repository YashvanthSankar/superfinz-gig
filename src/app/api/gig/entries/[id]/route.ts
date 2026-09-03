import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteGigEntry } from "@/lib/gig-store";

export async function DELETE(request: NextRequest, context: RouteContext<"/api/gig/entries/[id]">) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const deleted = await deleteGigEntry(session.userId, id);
  return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Entry not found" }, { status: 404 });
}
