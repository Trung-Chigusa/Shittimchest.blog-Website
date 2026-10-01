import { cn } from "@/lib/utils";

/** HUD section header: "01 ◆ LABEL" + title + a fading rule. */
export function SectionHeading({
  index,
  eyebrow,
  title,
  body,
  children,
  className,
}: {
  index?: number;
  eyebrow: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-reveal className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="max-w-2xl">
        <div className="flex items-center gap-4">
          {index ? <span className="font-mono text-xs text-subtle">{String(index).padStart(2, "0")}</span> : null}
          <p className="eyebrow">{eyebrow}</p>
          <span className="h-px w-16 bg-gradient-to-r from-primary/60 to-transparent" />
        </div>
        <h2 className="hud-title mt-3 text-2xl sm:text-3xl">{title}</h2>
        {body ? <p className="mt-3 text-muted">{body}</p> : null}
      </div>
      {children}
    </div>
  );
}
