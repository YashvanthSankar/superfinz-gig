"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function ThemeDock() {
  const pathname = usePathname();
  if (!pathname || !["/", "/login", "/demo"].includes(pathname)) return null;
  return (
    <ThemeToggle
      compact
      className="fixed bottom-4 right-4 z-50 shadow-[var(--shadow-md)]"
    />
  );
}
