import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";
import { GigDashboardView } from "@/components/gig/dashboard-view";
import { createGigDemo } from "@/lib/gig-demo";

export default function DemoPage() {
  return <main className="min-h-dvh bg-paper px-4 py-5 sm:px-6 lg:px-10"><nav aria-label="Demo navigation" className="mx-auto mb-6 flex max-w-6xl items-center justify-between gap-3"><Link href="/" className="brut-btn min-h-11 bg-paper text-ink"><ArrowLeft aria-hidden size={16} />Home</Link><Link href="/login" className="brut-btn min-h-11 bg-accent text-paper">Use my plan<LogIn aria-hidden size={16} /></Link></nav><div className="mx-auto max-w-6xl"><div className="mb-5 border-2 border-ink bg-warn-soft p-3 text-sm font-bold">Prototype data for Ravi Kumar. No bank account, platform connection, money transfer, credit check, or loan is created.</div><GigDashboardView dashboard={createGigDemo()} demo /></div></main>;
}
