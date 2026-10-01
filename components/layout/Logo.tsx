import { cn } from "@/lib/utils";

/** Diamond sigil: an original mark echoing the emblem's core. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative grid h-9 w-9 shrink-0 place-items-center", className)} aria-hidden="true">
      <svg viewBox="0 0 40 40" className="h-full w-full" fill="none">
        <path d="M20 2 L38 20 L20 38 L2 20 Z" stroke="rgb(var(--primary))" strokeWidth="1.2" />
        <path d="M20 9 L31 20 L20 31 L9 20 Z" fill="rgb(var(--primary) / 0.16)" stroke="rgb(255 245 214 / 0.85)" strokeWidth="1" />
        <path d="M20 14 L26 20 L20 26 L14 20 Z" fill="rgb(var(--primary))" />
        <circle cx="20" cy="20" r="1.6" fill="rgb(var(--bg))" />
      </svg>
      <span className="absolute inset-0 -z-10 rotate-45 scale-75 bg-primary/25 blur-md" />
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="group flex items-center gap-3">
      <LogoMark className="transition duration-500 group-hover:rotate-90" />
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[0.95rem] font-bold uppercase tracking-[0.22em] text-fg">Wanna Denia</span>
          <span className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-primary/80">shittimchest.blog</span>
        </span>
      )}
    </span>
  );
}
