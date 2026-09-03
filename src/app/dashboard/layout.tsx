import { Sidebar } from "@/components/dashboard/sidebar";
import { getSession } from "@/lib/auth";
import { getGigBundle } from "@/lib/gig-store";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.onboarded) redirect("/onboarding");
  if (!(await getGigBundle(session.userId))) redirect("/onboarding");
  return (
    <div className="flex min-h-dvh bg-paper text-ink">
      <Sidebar />
      <main id="main-content" className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 pb-28 pt-20 sm:px-6 lg:p-8 xl:px-10 xl:py-9">
          {children}
        </div>
      </main>
    </div>
  );
}
