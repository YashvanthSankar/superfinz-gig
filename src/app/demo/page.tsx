import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info, LogIn } from "lucide-react";
import { GigDashboardView } from "@/components/gig/dashboard-view";
import { Button } from "@/components/ui/button";
import { createGigDemo } from "@/lib/gig-demo";

export const metadata: Metadata = { title: "Live demo" };

export default function DemoPage() {
  return (
    <main className="min-h-dvh bg-paper px-4 py-5 text-ink sm:px-6 lg:px-10">
      <nav
        aria-label="Demo navigation"
        className="mx-auto mb-6 flex max-w-6xl items-center justify-between gap-3"
      >
        <Button asChild variant="secondary">
          <Link href="/">
            <ArrowLeft aria-hidden size={16} />
            Home
          </Link>
        </Button>
        <Button asChild variant="accent">
          <Link href="/login">
            Use my plan
            <LogIn aria-hidden size={16} />
          </Link>
        </Button>
      </nav>
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-line bg-warn-soft px-4 py-3 text-sm font-medium text-warn">
          <Info aria-hidden size={18} className="mt-0.5 shrink-0" />
          <p>
            Prototype data for Ravi Kumar. No bank account, platform connection,
            money transfer, credit check, or loan is created.
          </p>
        </div>
        <GigDashboardView dashboard={createGigDemo()} demo />
      </div>
    </main>
  );
}
