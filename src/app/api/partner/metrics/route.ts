import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getGigPartnerMetrics } from "@/lib/gig-store";

const schema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  city: z.string().trim().max(80).optional(),
  workType: z.string().trim().max(40).optional(),
});

export async function GET(request: NextRequest) {
  const configuredKey = process.env.PARTNER_METRICS_TOKEN;
  if (!configuredKey)
    return NextResponse.json(
      { error: "Partner metrics are not configured" },
      { status: 503 },
    );
  const providedKey = request.headers.get("x-partner-api-key") ?? "";
  const authorized =
    providedKey.length === configuredKey.length &&
    timingSafeEqual(Buffer.from(providedKey), Buffer.from(configuredKey));
  if (!authorized)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const values = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = schema.safeParse(values);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid partner-dashboard filter" },
      { status: 400 },
    );
  const metrics = await getGigPartnerMetrics(parsed.data);
  if (metrics.metrics.activeWorkers < metrics.policy.minimumCohortSize)
    return NextResponse.json(
      { error: "Cohort is too small to report safely" },
      { status: 409 },
    );
  return NextResponse.json(
    { metrics },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
