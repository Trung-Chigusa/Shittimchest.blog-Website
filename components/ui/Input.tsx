import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldClasses =
  "w-full border border-line bg-bg/60 px-3.5 text-sm text-fg outline-none transition placeholder:text-subtle hover:border-muted/50 focus:border-primary focus:bg-bg/80 focus:shadow-[0_0_0_1px_rgb(var(--primary)/0.4),0_0_20px_-6px_rgb(var(--primary)/0.6)] disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldClasses, "h-11", className)} {...props} />
));

Input.displayName = "Input";
