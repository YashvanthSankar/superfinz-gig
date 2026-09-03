import { NextRequest, NextResponse } from "next/server";
import {
  virtualTabInputSchema,
} from "@superfinz/shared";
import { getSession } from "@/lib/auth";
import {
  createGigVirtualTab,
  ensureGigSafetyTab,
  listGigVirtualTabs,
  updateGigVirtualTab,
} from "@/lib/gig-store";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureGigSafetyTab(session.userId);
  return NextResponse.json({
    tabs: await listGigVirtualTabs(session.userId),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = virtualTabInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid savings tab" },
      { status: 400 },
    );
  try {
    return NextResponse.json(
      { tab: await createGigVirtualTab(session.userId, parsed.data) },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create tab" },
      { status: 409 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.tabId !== "string")
    return NextResponse.json({ error: "Tab id is required" }, { status: 400 });
  try {
    const tab = await updateGigVirtualTab(session.userId, {
      tabId: body.tabId,
      ...(typeof body.tabName === "string" ? { tabName: body.tabName } : {}),
      ...(typeof body.isLocked === "boolean" ? { isLocked: body.isLocked } : {}),
    });
    return NextResponse.json({ tab });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update tab" },
      { status: 409 },
    );
  }
}