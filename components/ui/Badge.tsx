import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "neutral" | "success" | "warning" | "danger" | "halo";

const tones: Record<Tone, string> = {
  primary: "border-primary/40 bg-primary/10 text-primary",
  neutral: "border-line bg-fg/[0.04] text-muted",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  danger: "border-danger/40 bg-danger/10 text-danger",
  halo: "border-halo/40 bg-halo/10 text-halo",
};

export function Badge({ className, tone = "primary", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-0.5 font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

const statusTone: Record<string, Tone> = {
  PUBLISHED: "success",
  PENDING: "warning",
  DRAFT: "neutral",
  REJECTED: "danger",
  ARCHIVED: "neutral",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge tone={statusTone[status] ?? "neutral"}>
      <span className="h-1.5 w-1.5 rotate-45 bg-current" aria-hidden="true" />
      {label}
    </Badge>
  );
}
