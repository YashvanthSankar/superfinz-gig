"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { LoaderCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border font-semibold tracking-[-0.01em] whitespace-nowrap",
    "transition-[transform,box-shadow,background-color,border-color,color] duration-200",
    "focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-primary text-on-primary shadow-sm hover:-translate-y-px hover:shadow-md active:translate-y-0",
        accent:
          "border-transparent bg-accent text-on-accent shadow-sm hover:-translate-y-px hover:shadow-md active:translate-y-0",
        secondary:
          "border-line-strong bg-surface text-ink shadow-sm hover:bg-paper-2 hover:shadow-md",
        outline:
          "border-line-strong bg-transparent text-ink hover:border-accent hover:bg-accent-soft",
        ghost:
          "border-transparent bg-transparent text-ink-soft hover:bg-paper-2 hover:text-ink",
        soft:
          "border-transparent bg-accent-soft text-accent-ink hover:bg-accent/15",
        danger:
          "border-transparent bg-bad text-on-bad shadow-sm hover:-translate-y-px hover:shadow-md active:translate-y-0",
        "danger-soft":
          "border-transparent bg-bad-soft text-bad hover:bg-bad/20",
      },
      size: {
        sm: "min-h-11 px-3 text-sm",
        md: "min-h-11 px-4 text-sm",
        lg: "min-h-12 px-6 text-base",
        xl: "min-h-14 px-6 text-base",
        icon: "h-11 w-11 p-0",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render the child element (for example a Next.js Link) with button styling. */
  asChild?: boolean;
  /** Shows a spinner, sets aria-busy and disables the control. */
  loading?: boolean;
  /** Screen-reader text announced while loading. */
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      block,
      asChild = false,
      loading = false,
      loadingLabel = "Working",
      disabled,
      type,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size, block }), className);

    if (asChild) {
      return (
        <Slot ref={ref} className={classes} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={classes}
        {...props}
      >
        {loading && (
          <>
            <LoaderCircle
              aria-hidden
              size={16}
              className="animate-spin motion-reduce:animate-none"
            />
            <span className="sr-only">{loadingLabel}</span>
          </>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
