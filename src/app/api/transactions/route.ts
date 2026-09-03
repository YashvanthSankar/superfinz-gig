import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import { createTransaction, listTransactions } from "@/lib/convex-store";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const createSchema = z.object({
  amount: z.number().positive().max(10_000_000),
  category: z.string().min(1).max(50),
  description: z.string().min(1).max(200),
  date: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let startInclusive: Date | undefined;
  let endExclusive: Date | undefined;
  if (month && year) {
    startInclusive = new Date(parseInt(year), parseInt(month) - 1, 1);
    endExclusive = new Date(parseInt(year), parseInt(month), 1);
  }

  const { transactions, total } = await listTransactions({
    userId: session.userId,
    startInclusive,
    endExclusive,
    limit,
    offset,
    descending: true,
  });

  return NextResponse.json({ transactions, total });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`tx:${session.userId}`, { limit: 60, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { amount, category, description, date } = parsed.data;

  const transaction = await createTransaction({
    userId: session.userId,
    amount,
    category,
    description,
    date: date ? new Date(date) : new Date(),
  });

  revalidateTag(`dashboard-${session.userId}`, "default");
  return NextResponse.json({ transaction }, { status: 201 });
}
