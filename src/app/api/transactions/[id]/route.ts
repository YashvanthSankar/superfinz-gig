import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import { deleteTransaction } from "@/lib/convex-store";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const deleted = await deleteTransaction(session.userId, id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  revalidateTag(`dashboard-${session.userId}`, "default");
  return NextResponse.json({ success: true });
}
