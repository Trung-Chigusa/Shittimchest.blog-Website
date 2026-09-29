import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-md border border-white/12 bg-slate-950/45 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/70 focus:ring-2 focus:ring-cyan-300/20 disabled:opacity-60",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
