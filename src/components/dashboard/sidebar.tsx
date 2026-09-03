"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { CalendarClock, CirclePlus, House, LogOut, MessageCircle, Settings, ShieldCheck, WalletCards } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Today", icon: House },
  { href: "/dashboard/income", label: "Income", icon: WalletCards },
  { href: "/dashboard/plan", label: "Plan", icon: CalendarClock },
  { href: "/dashboard/safety", label: "Safety", icon: ShieldCheck },
  { href: "/dashboard/coach", label: "Coach", icon: MessageCircle },
];

export function Sidebar() {
  const pathname = usePathname(); const { data: session } = useSession(); const active = (href: string) => href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  return <><aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r-2 border-ink bg-paper lg:flex"><Link href="/" aria-label="SuperFinz home" className="flex min-h-20 items-center gap-3 border-b-2 border-ink px-5"><Logo size="md" /><span className="text-lg font-black">SUPERFINZ</span></Link><div className="p-3"><Link href="/dashboard/income" className="brut-btn min-h-12 w-full bg-accent text-paper"><CirclePlus aria-hidden size={18} />Add entry</Link></div><nav aria-label="Dashboard navigation" className="flex-1 space-y-1 px-3">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cn("flex min-h-12 items-center gap-3 border-2 px-3 text-xs font-black uppercase tracking-wider focus:outline-2 focus:outline-offset-2 focus:outline-ink", active(href) ? "border-ink bg-ink text-paper" : "border-transparent hover:border-ink hover:bg-paper-2")}><Icon aria-hidden size={19} strokeWidth={2.5} />{label}</Link>)}</nav><div className="space-y-2 border-t-2 border-ink p-3"><span className="brut-stamp bg-accent-soft">Prototype integrations</span><Link href="/dashboard/settings" className={cn("flex min-h-12 items-center gap-3 border-2 px-3 text-xs font-black uppercase tracking-wider", active("/dashboard/settings") ? "border-ink bg-ink text-paper" : "border-transparent hover:border-ink hover:bg-paper-2")}><Settings aria-hidden size={18} />Settings</Link><button onClick={() => signOut({ callbackUrl: "/" })} className="flex min-h-12 w-full items-center gap-3 border-2 border-transparent px-3 text-xs font-black uppercase tracking-wider text-bad hover:border-ink hover:bg-bad hover:text-paper"><LogOut aria-hidden size={18} />Sign out</button></div></aside><header className="fixed inset-x-0 top-0 z-40 flex min-h-14 items-center justify-between border-b-2 border-ink bg-paper px-4 lg:hidden"><Link href="/dashboard" aria-label="SuperFinz Today" className="flex items-center gap-2"><Logo size="sm" /><span className="font-black">SUPERFINZ</span></Link><div className="flex items-center gap-2"><span className="brut-stamp bg-accent-soft">Prototype</span><Link href="/dashboard/settings" aria-label="Settings" className="flex h-11 w-11 items-center justify-center border-2 border-ink bg-paper"><Settings aria-hidden size={19} /></Link></div></header><nav aria-label="Mobile dashboard navigation" className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t-2 border-ink bg-paper lg:hidden">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wide", active(href) ? "bg-ink text-paper" : "hover:bg-paper-2")}><Icon aria-hidden size={20} strokeWidth={active(href) ? 2.8 : 2} /><span>{label}</span></Link>)}</nav><span className="sr-only">Signed in as {session?.user?.name ?? "SuperFinz user"}</span></>;
}
