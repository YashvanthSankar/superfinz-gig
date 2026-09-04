import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Variant = "default" | "accent" | "good" | "bad" | "warn" | "ink";

const MAP: Record<Variant, string> = {
  default: "border-line bg-paper-2 text-ink-soft",
  accent: "border-transparent bg-accent-soft text-accent-ink",
  good: "border-transparent bg-good-soft text-good",
  bad: "border-transparent bg-bad-soft text-bad",
  warn: "border-transparent bg-warn-soft text-warn",
  ink: "border-transparent bg-primary text-on-primary",
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
        "inline-flex min-h-7 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-tight",
        MAP[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
