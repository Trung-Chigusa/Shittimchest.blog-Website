import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-cyan-200/25 bg-cyan-200/10 px-2 py-1 text-xs font-medium text-cyan-100",
        className,
      )}
      {...props}
    />
  );
}
