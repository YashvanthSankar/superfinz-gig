"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border font-semibold tracking-[-0.01em] shadow-[var(--shadow-sm)] transition-[transform,box-shadow,background-color,border-color] duration-200 focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-ink text-paper hover:-translate-y-px hover:shadow-[var(--shadow-md)] active:translate-y-0",
        accent:
          "border-transparent bg-accent text-paper hover:-translate-y-px hover:shadow-[var(--shadow-md)] active:translate-y-0",
        secondary:
          "border-ink bg-paper text-ink hover:bg-paper-2 hover:shadow-[var(--shadow-md)]",
        outline:
          "border-ink bg-transparent text-ink shadow-none hover:border-accent hover:bg-accent-soft",
        ghost:
          "border-transparent bg-transparent text-ink shadow-none hover:bg-paper-2",
        danger:
          "border-transparent bg-bad text-paper hover:-translate-y-px hover:shadow-[var(--shadow-md)] active:translate-y-0",
      },
      size: {
        sm: "min-h-11 px-3 text-sm",
        md: "min-h-11 px-4 text-sm",
        lg: "min-h-12 px-6 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading && (
          <svg
            aria-hidden
            className="h-4 w-4 animate-spin motion-reduce:animate-none"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
