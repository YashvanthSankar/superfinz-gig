"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  CalendarClock,
  CirclePlus,
  House,
  LogOut,
  MessageCircle,
  Settings,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Today", icon: House },
  { href: "/dashboard/income", label: "Money", icon: WalletCards },
  { href: "/dashboard/plan", label: "Plan", icon: CalendarClock },
  { href: "/dashboard/safety", label: "Safety", icon: ShieldCheck },
  { href: "/dashboard/coach", label: "Coach", icon: MessageCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const active = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  const initials =
    session?.user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SF";

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink bg-paper/95 lg:flex">
        <Link
          href="/"
          aria-label="SuperFinz home"
          className="flex min-h-20 items-center gap-3 px-5"
        >
          <Logo size="md" />
          <div>
            <span className="block text-[1.05rem] font-bold tracking-[-0.025em]">
              SuperFinz
            </span>
            <span className="block text-[11px] font-medium text-mute">
              Financial resilience
            </span>
          </div>
        </Link>

        <div className="px-3 pb-5 pt-2">
          <Link
            href="/dashboard/income"
            className="brut-btn min-h-12 w-full border-transparent bg-accent text-paper shadow-none"
          >
            <CirclePlus aria-hidden size={18} />
            Add income or cost
          </Link>
        </div>

        <nav
          aria-label="Dashboard navigation"
          className="flex-1 space-y-1 px-3"
        >
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-mute">
            Workspace
          </p>
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-offset-0",
                active(href)
                  ? "border-ink bg-accent-soft text-accent-ink"
                  : "text-ink-soft hover:bg-paper-2 hover:text-ink",
              )}
            >
              <Icon
                aria-hidden
                size={19}
                strokeWidth={active(href) ? 2.25 : 1.8}
              />
              {label}
              {active(href) && (
                <span
                  aria-hidden
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-accent"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="space-y-2 border-t border-ink p-3">
          <ThemeToggle className="w-full justify-start shadow-none" />
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-200",
              active("/dashboard/settings")
                ? "bg-accent-soft text-accent-ink"
                : "text-ink-soft hover:bg-paper-2 hover:text-ink",
            )}
          >
            <Settings aria-hidden size={18} />
            Settings
          </Link>
          <div className="flex items-center gap-3 rounded-xl border border-ink bg-paper-2 p-2.5">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper"
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {session?.user?.name ?? "SuperFinz user"}
              </p>
              <p className="truncate text-[11px] text-mute">
                Prototype workspace
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              aria-label="Sign out"
              title="Sign out"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-mute transition-colors hover:bg-bad-soft hover:text-bad"
            >
              <LogOut aria-hidden size={18} />
            </button>
          </div>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex min-h-16 items-center justify-between border-b border-ink bg-paper/95 px-4 backdrop-blur-md lg:hidden">
        <Link
          href="/dashboard"
          aria-label="SuperFinz Today"
          className="flex items-center gap-2.5"
        >
          <Logo size="sm" />
          <span className="font-bold tracking-[-0.025em]">SuperFinz</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link
            href="/dashboard/settings"
            aria-label="Open settings"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink bg-paper"
          >
            <Settings aria-hidden size={19} />
          </Link>
        </div>
      </header>

      <nav
        aria-label="Mobile dashboard navigation"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-ink bg-paper/95 px-1 backdrop-blur-md lg:hidden"
      >
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? "page" : undefined}
            className={cn(
              "relative flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors duration-200",
              active(href)
                ? "text-accent-ink"
                : "text-mute hover:bg-paper-2 hover:text-ink",
            )}
          >
            {active(href) && (
              <span
                aria-hidden
                className="absolute top-1.5 h-1 w-5 rounded-full bg-accent"
              />
            )}
            <Icon
              aria-hidden
              size={20}
              strokeWidth={active(href) ? 2.4 : 1.8}
            />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <span className="sr-only">
        Signed in as {session?.user?.name ?? "SuperFinz user"}
      </span>
    </>
  );
}
