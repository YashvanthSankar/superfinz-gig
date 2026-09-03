import { getSession } from "@/lib/auth";
import { getGigBundle } from "@/lib/gig-store";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.onboarded && await getGigBundle(session.userId)) redirect("/dashboard");
  return <>{children}</>;
}
