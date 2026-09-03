"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="brut-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        className={cn(
          "h-12 w-full rounded-xl border border-ink bg-paper px-3 text-base font-medium text-ink shadow-sm",
          "placeholder:font-normal placeholder:text-mute",
          "transition-[background-color,border-color,box-shadow] duration-200 focus:border-accent focus:bg-paper focus:outline-none focus:ring-4 focus:ring-accent/15",
          type === "number" && "tabular",
          error && "border-bad bg-bad-soft",
          className,
        )}
        {...props}
      />
      {error && (
        <p role="alert" className="text-sm font-medium text-bad">
          {error}
        </p>
      )}
    </div>
  ),
);
Input.displayName = "Input";
