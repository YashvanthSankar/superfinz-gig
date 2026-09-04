"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/** Floating theme toggle for public pages that have no sidebar. */
export function ThemeDock() {
  const pathname = usePathname();
  const show =
    pathname === "/login" ||
    pathname.startsWith("/demo") ||
    pathname.startsWith("/onboarding");
  if (!show) return null;
  return (
    <ThemeToggle
      compact
      className="fixed bottom-4 right-4 z-50 shadow-md"
    />
  );
}
