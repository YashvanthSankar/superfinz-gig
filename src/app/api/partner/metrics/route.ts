import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGigPartnerMetrics } from "@/lib/gig-store";

const schema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  city: z.string().trim().max(80).optional(),
  workType: z.string().trim().max(40).optional(),
});

export async function GET(request: NextRequest) {
  const values = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = schema.safeParse(values);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid partner-dashboard filter" },
      { status: 400 },
    );
  const metrics = await getGigPartnerMetrics(parsed.data);
  return NextResponse.json(
    { metrics },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
