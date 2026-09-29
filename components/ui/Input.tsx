import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldClasses =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-fg shadow-sm outline-none transition placeholder:text-subtle hover:border-subtle/50 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldClasses, "h-11", className)} {...props} />
));

Input.displayName = "Input";
