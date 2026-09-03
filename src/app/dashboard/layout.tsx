import { Sidebar } from '@/components/dashboard/sidebar';
import { getSession } from '@/lib/auth';
import { getGigBundle } from '@/lib/gig-store';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.onboarded) redirect('/onboarding');
  if (!await getGigBundle(session.userId)) redirect('/onboarding');
  return (
    <div className="flex min-h-dvh text-ink bg-paper">
      <Sidebar />
      <main id="main-content" className="min-w-0 flex-1">
        <div className="max-w-6xl mx-auto px-4 py-5 pt-[4.5rem] pb-24 sm:px-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
