"use client";
import { ReactNode, SelectHTMLAttributes, forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, controlClasses, fieldDescribedBy } from "./field";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, wrapperClassName, label, hint, error, id: idProp, required, children, ...props },
    ref,
  ) => {
    const generated = useId();
    const id = idProp ?? generated;
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
          <select
            ref={ref}
            id={id}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={fieldDescribedBy(id, hint, error)}
            className={cn(controlClasses, "appearance-none pr-11", className)}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            aria-hidden
            size={18}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-mute"
          />
        </div>
      </Field>
    );
  },
);
Select.displayName = "Select";
