import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listTransactions } from "@/lib/convex-store";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  threeMonthsAgo.setHours(0, 0, 0, 0);

  const { transactions } = await listTransactions({
    userId: session.userId,
    startInclusive: threeMonthsAgo,
  });

  // Group by date string
  const map: Record<string, { total: number; count: number }> = {};
  for (const tx of transactions) {
    const key = tx.date.toISOString().slice(0, 10);
    if (!map[key]) map[key] = { total: 0, count: 0 };
    map[key].total += tx.amount;
    map[key].count += 1;
  }

  const heatmap = Object.entries(map).map(([date, v]) => ({ date, ...v }));
  return NextResponse.json({ heatmap });
}
