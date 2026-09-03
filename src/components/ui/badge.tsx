import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Variant = "default" | "accent" | "good" | "bad" | "warn" | "ink";

const MAP: Record<Variant, string> = {
  default: "bg-paper text-ink",
  accent: "bg-accent text-paper",
  good: "bg-good-soft text-good",
  bad: "bg-bad-soft text-bad",
  warn: "bg-warn-soft text-ink",
  ink: "bg-ink text-paper",
};

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1 rounded-full border border-ink px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        MAP[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
