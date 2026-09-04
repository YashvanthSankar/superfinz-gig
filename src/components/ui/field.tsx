"use client";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FieldProps {
  id: string;
  label?: ReactNode;
  /** Short helper copy shown under the control. */
  hint?: ReactNode;
  /** Error copy shown under the control; also marks the control invalid. */
  error?: ReactNode;
  required?: boolean;
  /** Renders label and control side by side on wide screens. */
  inline?: boolean;
  className?: string;
  children: ReactNode;
}

export function fieldDescribedBy(id: string, hint?: ReactNode, error?: ReactNode) {
  const ids: string[] = [];
  if (error) ids.push(`${id}-error`);
  if (hint) ids.push(`${id}-hint`);
  return ids.length ? ids.join(" ") : undefined;
}

/** Label, control, hint and error stacked with consistent spacing. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="brut-label flex items-baseline gap-1">
          <span>{label}</span>
          {required && (
            <span aria-hidden className="text-bad">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const controlClasses = cn(
  "h-12 w-full min-w-0 rounded-xl border border-line-strong bg-surface px-3.5 text-base font-medium text-ink shadow-sm",
  "placeholder:font-normal placeholder:text-mute",
  "transition-[background-color,border-color,box-shadow] duration-200",
  "focus:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/20",
  "disabled:cursor-not-allowed disabled:bg-paper-2 disabled:opacity-60",
  "aria-[invalid=true]:border-bad aria-[invalid=true]:bg-bad-soft/40",
);
