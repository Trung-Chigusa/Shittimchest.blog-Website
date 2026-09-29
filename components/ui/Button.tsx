import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-cyan-300/50 bg-cyan-300 text-slate-950 shadow-glow hover:bg-white focus-visible:ring-cyan-200",
  secondary:
    "border-white/15 bg-white/10 text-white hover:border-cyan-200/60 hover:bg-cyan-200/10 focus-visible:ring-cyan-200",
  ghost:
    "border-transparent bg-transparent text-slate-200 hover:bg-white/8 hover:text-white focus-visible:ring-cyan-200",
  danger:
    "border-red-300/40 bg-red-500/20 text-red-100 hover:bg-red-500/30 focus-visible:ring-red-200",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-55",
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
