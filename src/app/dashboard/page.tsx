import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { calculateGigDashboard } from "@superfinz/shared";
import { GigDashboardView } from "@/components/gig/dashboard-view";
import { getSession } from "@/lib/auth";
import { getGigBundle } from "@/lib/gig-store";

export const metadata: Metadata = { title: "Today" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.onboarded) redirect("/onboarding");
  const bundle = await getGigBundle(session.userId);
  if (!bundle) redirect("/onboarding");

  return <GigDashboardView dashboard={calculateGigDashboard(bundle)} />;
}
