import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dashboard = await getDashboardData(session.userId);
  if (!dashboard) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ dashboard });
}
