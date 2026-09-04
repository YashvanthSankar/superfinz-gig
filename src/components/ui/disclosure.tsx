import { ChevronDown } from "lucide-react";
import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DisclosureProps extends Omit<HTMLAttributes<HTMLDetailsElement>, "title"> {
  title: ReactNode;
  /** Optional small text under the title, visible when closed. */
  summary?: ReactNode;
  defaultOpen?: boolean;
  /** Use "plain" inside a coloured parent, "card" for a stand-alone card. */
  tone?: "card" | "plain";
  children: ReactNode;
}

/** Native <details> with a 44px summary row and a rotating chevron. */
export function Disclosure({
  title,
  summary,
  defaultOpen,
  tone = "card",
  className,
  children,
  ...props
}: DisclosureProps) {
  return (
    <details
      className={cn("group", tone === "card" && "brut-card px-5 sm:px-6", className)}
      open={defaultOpen}
      {...props}
    >
      <summary
        className={cn(
          "flex min-h-14 cursor-pointer select-none items-center justify-between gap-4 rounded-xl py-3 font-semibold text-inherit",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <span className="min-w-0">
          <span className="block">{title}</span>
          {summary && (
            <span className="mt-0.5 block text-sm font-normal text-mute group-open:hidden">
              {summary}
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden
          size={20}
          className="shrink-0 opacity-70 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className={cn("pb-5", tone === "card" ? "border-t border-line pt-4" : "pt-1")}>
        {children}
      </div>
    </details>
  );
}
