import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "ink" | "outline" | "ghost" | "danger-ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-counterlime text-ink hover:bg-[#d3f885] shadow-sm",
  ink: "bg-ink text-mineral hover:bg-[#1f332f]",
  outline:
    "border border-ink/15 bg-white text-ink hover:border-ink/35 hover:bg-white",
  ghost: "text-ink/70 hover:bg-ink/5 hover:text-ink",
  "danger-ghost": "text-coral hover:bg-coral/10",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-xs gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-13 px-5 text-base gap-2",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "pressable inline-flex items-center justify-center rounded-lg font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-40",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    />
  );
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "pressable inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink/70 hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
