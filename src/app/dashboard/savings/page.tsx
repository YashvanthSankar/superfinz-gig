import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureGigSafetyTab, listGigVirtualTabs } from "@/lib/gig-store";
import { SavingsClient } from "@/components/gig/savings-client";

export default async function SavingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  await ensureGigSafetyTab(session.userId);
  return <SavingsClient initialTabs={await listGigVirtualTabs(session.userId)} />;
}