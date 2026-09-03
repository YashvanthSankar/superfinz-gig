import { redirect } from "next/navigation";
import { calculateGigDashboard } from "@superfinz/shared";
import { InsightsClient } from "@/components/gig/insights-client";
import { getSession } from "@/lib/auth";
import { getGigBundle } from "@/lib/gig-store";

export default async function InsightsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.onboarded) redirect("/onboarding");
  const bundle = await getGigBundle(session.userId);
  if (!bundle) redirect("/onboarding");

  return (
    <InsightsClient
      dashboard={calculateGigDashboard(bundle)}
      backHref="/dashboard"
    />
  );
}
