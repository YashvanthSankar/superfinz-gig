"use client";

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A form panel that opens inline. On mount it moves focus to its heading and
 * it closes on Escape; the parent returns focus to the trigger on close.
 */
export function Panel({
  eyebrow,
  title,
  onClose,
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  return (
    <section
      aria-labelledby={headingId}
      onKeyDown={handleKeyDown}
      className={cn("brut-card-lg p-5 sm:p-6", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="brut-label">{eyebrow}</p>
          <h2
            id={headingId}
            ref={headingRef}
            tabIndex={-1}
            className="brut-display mt-1 rounded-md text-2xl sm:text-3xl"
          >
            {title}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close panel"
          onClick={onClose}
        >
          <X aria-hidden size={19} />
        </Button>
      </div>
      {children}
    </section>
  );
}

export function ActionError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-sm font-medium text-bad",
        className,
      )}
    >
      <AlertCircle aria-hidden size={17} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
