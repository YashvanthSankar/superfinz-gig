import { NextRequest, NextResponse } from "next/server";
import {
  calculateGigDashboard,
  payoutSplitInputSchema,
  projectPayoutSplit,
  recommendAdaptiveSplit,
} from "@superfinz/shared";
import { getSession } from "@/lib/auth";
import {
  applyGigPayoutSplit,
  getGigBundle,
  recordGigOutcome,
} from "@/lib/gig-store";

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = payoutSplitInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payout split" },
      { status: 400 },
    );
  const bundle = await getGigBundle(session.userId);
  if (!bundle)
    return NextResponse.json(
      { error: "Complete onboarding first" },
      { status: 409 },
    );
  const adaptive = recommendAdaptiveSplit(
    bundle,
    parsed.data.amount,
    parsed.data.receivedAt,
    parsed.data.sourceId,
  );
  const percentages =
    parsed.data.allocationMode === "ADAPTIVE"
      ? adaptive.percentages
      : parsed.data.percentages;
  const projection = projectPayoutSplit(
    bundle,
    parsed.data.amount,
    percentages,
    parsed.data.receivedAt,
    parsed.data.sourceId,
  );
  const split = await applyGigPayoutSplit(session.userId, {
    ...parsed.data,
    percentages,
    allocationMode: parsed.data.allocationMode,
    beforeSafeAmount: projection.beforeSafeAmount,
    afterSafeAmount: projection.afterSafeAmount,
    beforeProtectedDays: projection.beforeProtectedDays,
    afterProtectedDays: projection.afterProtectedDays,
    fundedCommitmentIds:
      parsed.data.allocationMode === "ADAPTIVE"
        ? adaptive.fundedCommitments.map((item) => item.id)
        : [],
    recommendationReason: adaptive.reasons.join(" "),
  });
  if (parsed.data.allocationMode === "ADAPTIVE")
    await recordGigOutcome(session.userId, {
      type: "RECOMMENDED_ACTION_COMPLETED",
      value: parsed.data.amount,
      metadata: parsed.data.allocationMode,
    });
  const updatedBundle = await getGigBundle(session.userId).catch(() => null);
  return NextResponse.json(
    {
      split,
      applied: { percentages, ...projection },
      recommendation: adaptive,
      dashboard: updatedBundle ? calculateGigDashboard(updatedBundle) : null,
    },
    { status: 201 },
  );
}
