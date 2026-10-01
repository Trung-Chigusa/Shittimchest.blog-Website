import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative flex flex-col items-center border border-dashed border-line px-6 py-16 text-center", className)}>
      <span className="relative grid h-14 w-14 place-items-center">
        <span className="absolute inset-0 rotate-45 border border-primary/50" />
        <span className="absolute inset-2 rotate-45 bg-primary/10" />
        <Icon className="relative h-5 w-5 text-primary" aria-hidden="true" />
      </span>
      <p className="mt-6 font-display text-base font-semibold uppercase tracking-[0.14em] text-fg">{title}</p>
      {body ? <p className="mt-2 max-w-sm text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}
