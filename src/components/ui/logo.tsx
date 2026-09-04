interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-8 w-8 rounded-[0.6rem] text-xs",
  md: "h-11 w-11 rounded-xl text-sm",
  lg: "h-[4.5rem] w-[4.5rem] rounded-[1.25rem] text-xl",
  xl: "h-[3.75rem] w-[3.75rem] rounded-2xl text-lg",
} as const;

export function Logo({ size = "md", className = "" }: LogoProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center bg-primary font-bold tracking-[-0.06em] text-on-primary shadow-sm ${SIZE_MAP[size]} ${className}`}
    >
      SF
      <span className="absolute right-[12%] top-[12%] h-[18%] w-[18%] rounded-full bg-accent" />
    </span>
  );
}
