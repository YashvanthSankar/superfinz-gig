"use client";
import { InputHTMLAttributes, ReactNode, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { Field, controlClasses, fieldDescribedBy } from "./field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Short text shown inside the field on the left, for example a currency symbol. */
  prefix?: string;
  /** Short text shown inside the field on the right, for example a unit. */
  suffix?: string;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      wrapperClassName,
      label,
      hint,
      error,
      prefix,
      suffix,
      id: idProp,
      type = "text",
      required,
      inputMode,
      ...props
    },
    ref,
  ) => {
    const generated = useId();
    const id = idProp ?? generated;
    const numeric = type === "number";
    return (
      <Field
        id={id}
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={wrapperClassName}
      >
        <div className="relative">
          {prefix && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-medium text-mute"
            >
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            type={type}
            required={required}
            inputMode={inputMode ?? (numeric ? "decimal" : undefined)}
            aria-invalid={error ? true : undefined}
            aria-describedby={fieldDescribedBy(id, hint, error)}
            className={cn(
              controlClasses,
              numeric && "tabular",
              prefix && "pl-8",
              suffix && "pr-14",
              className,
            )}
            {...props}
          />
          {suffix && (
            <span
              aria-hidden
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-mute"
            >
              {suffix}
            </span>
          )}
        </div>
      </Field>
    );
  },
);
Input.displayName = "Input";
