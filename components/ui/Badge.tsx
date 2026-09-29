import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "neutral" | "success" | "warning" | "danger" | "halo";

const tones: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary ring-primary/20",
  neutral: "bg-surface-2 text-muted ring-line",
  success: "bg-success/10 text-success ring-success/25",
  warning: "bg-warning/10 text-warning ring-warning/25",
  danger: "bg-danger/10 text-danger ring-danger/25",
  halo: "bg-halo/10 text-halo ring-halo/25",
};

export function Badge({ className, tone = "primary", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
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
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </Badge>
  );
}
