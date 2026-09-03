import { NextRequest, NextResponse } from "next/server";
import { calculateGigDashboard } from "@superfinz/shared";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getGigBundle } from "@/lib/gig-store";

const schema = z.object({ message: z.string().trim().min(1).max(500) });
const rupees = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export async function POST(request: NextRequest) {
  const session = await getSession(request); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Ask a short money question" }, { status: 400 }); const bundle = await getGigBundle(session.userId); if (!bundle) return NextResponse.json({ error: "Complete onboarding first" }, { status: 409 }); const dashboard = calculateGigDashboard(bundle); const text = parsed.data.message.toLowerCase(); const s = dashboard.summary;
  let reply: string;
  if (/(safe|spend|afford|buy)/.test(text)) reply = `You can safely use up to ${rupees(s.safeToSpend)} until ${new Date(s.safeUntil).toLocaleDateString("en-IN", { weekday: "long" })}. Known: your settled balance is ${rupees(s.availableBalance)} and ${rupees(s.protectedMoney)} is reserved by the current plan. Estimate: the next payout is ${rupees(s.expectedPayoutMin)}–${rupees(s.expectedPayoutMax)}. Keep new flexible spending inside the safe amount.`;
  else if (/(late|delay|payout)/.test(text)) reply = `If the next payout is late, first keep ${rupees(s.dueBeforeNextPayout)} for due commitments and about ${rupees(s.workCostsBeforeNextPayout)} for earning costs. Your current safe amount is ${rupees(s.safeToSpend)}. Do not count the expected ${rupees(s.expectedPayoutMin)}–${rupees(s.expectedPayoutMax)} until it settles; reschedule a flexible bill before using protected money.`;
  else if (/(cushion|emergency|buffer)/.test(text)) reply = `Your cushion currently covers about ${Math.floor(s.protectedDays)} days, against your ${s.cushionTargetDays}-day goal. This is an estimate based on recorded essential commitments and work costs. Protect a small amount from each settled payout; the next one-day step is shown in Today’s recommended action.`;
  else if (/(score|resilience|passport)/.test(text)) reply = `Your Resilience Passport is ${s.resilienceScore}/100: ${s.resilienceStatus}. It is a planning indicator, not a bureau credit score and not a loan decision. It uses income range, active source count, commitment coverage, cushion depth, and work-cost ratio. It does not use contacts, messages, or protected traits.`;
  else if (/(credit|loan|borrow|repair)/.test(text)) reply = `Start with the verified gap, not a loan amount. Your plan currently protects ${rupees(s.protectedMoney)} and shows ${rupees(s.safeToSpend)} safe to use. First reschedule flexible commitments, reduce flexible allocation, set a short earning target, and use only the necessary cushion amount. Any credit shown by SuperFinz must be a simulated regulated-partner offer with APR, fees, total repayment, schedule, cooling-off, and grievance details.`;
  else reply = `Direct answer: your current safe-to-spend amount is ${rupees(s.safeToSpend)} until ${new Date(s.safeUntil).toLocaleDateString("en-IN", { weekday: "long" })}. Known balance: ${rupees(s.availableBalance)}. Estimated next payout: ${rupees(s.expectedPayoutMin)}–${rupees(s.expectedPayoutMax)}. Ask about a late payout, cushion, resilience score, or whether a specific spend fits this plan.`;
  return NextResponse.json({ reply, figures: { safeToSpend: s.safeToSpend, availableBalance: s.availableBalance, protectedMoney: s.protectedMoney }, source: "deterministic-plan" });
}
