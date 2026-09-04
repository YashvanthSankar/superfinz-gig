"use client";
import { ReactNode, TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { Field, controlClasses, fieldDescribedBy } from "./field";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, wrapperClassName, label, hint, error, id: idProp, required, rows = 3, ...props },
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
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescribedBy(id, hint, error)}
          className={cn(controlClasses, "h-auto min-h-24 resize-y py-3 leading-6", className)}
          {...props}
        />
      </Field>
    );
  },
);
Textarea.displayName = "Textarea";
