import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("brut-card p-5 sm:p-6", className)} {...props}>
      {children}
    </div>
  );
}

/** Top row of a card: eyebrow + title on the left, optional action on the right. */
export function CardHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="brut-label">{eyebrow}</p>}
        <Heading className={cn("text-xl font-bold tracking-[-0.02em]", eyebrow && "mt-1")}>
          {title}
        </Heading>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-soft">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-ink", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardLabel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("brut-label", className)} {...props}>
      {children}
    </p>
  );
}
