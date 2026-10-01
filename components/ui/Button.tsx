import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "cut-sm bg-primary text-primary-fg shadow-[0_0_24px_-6px_rgb(var(--primary)/0.7)] hover:bg-[#ffe3a3] hover:shadow-[0_0_30px_-4px_rgb(var(--primary)/0.9)]",
  secondary:
    "border border-fg/25 bg-surface/60 text-fg backdrop-blur hover:border-primary hover:text-primary hover:bg-primary/[0.06]",
  soft: "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/60",
  ghost: "text-muted hover:bg-fg/[0.05] hover:text-fg",
  danger: "border border-danger/40 bg-danger/10 text-danger hover:bg-danger hover:text-white",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3.5 text-[0.7rem]",
  md: "h-10 gap-2 px-5 text-[0.75rem]",
  lg: "h-12 gap-2.5 px-7 text-[0.8rem]",
  icon: "h-9 w-9",
};

/** Shared classes so links can look like buttons without nesting <button> in <a>. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "group relative inline-flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap font-display font-bold uppercase tracking-[0.16em] transition duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={buttonClasses({ variant, size, className })} {...props} />
  ),
);

Button.displayName = "Button";
