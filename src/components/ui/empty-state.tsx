import type { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong bg-paper-2/60 px-6 py-10 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-accent-ink shadow-sm">
          <Icon aria-hidden size={22} />
        </span>
      )}
      <div className="max-w-sm">
        <p className="text-base font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 text-sm leading-6 text-ink-soft">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
