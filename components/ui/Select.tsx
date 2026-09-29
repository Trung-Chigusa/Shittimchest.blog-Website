import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full rounded-md border border-white/12 bg-slate-950/70 px-3 text-sm text-white outline-none transition focus:border-cyan-200/70 focus:ring-2 focus:ring-cyan-300/20 disabled:opacity-60",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = "Select";
