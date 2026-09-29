import { cn } from "@/lib/utils";

/** Halo-ring mark: a nod to the Shittim Chest / Blue Archive halo motif. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-glow",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none">
        <ellipse cx="16" cy="8.5" rx="8" ry="2.6" stroke="currentColor" strokeWidth="1.8" opacity="0.9" />
        <path
          d="M16 12.5l7 2.6v4.6c0 4.1-2.9 7.4-7 8.6-4.1-1.2-7-4.5-7-8.6v-4.6l7-2.6z"
          fill="currentColor"
          fillOpacity="0.95"
        />
        <path d="M13.2 20.2l2 2 3.8-4.2" stroke="rgb(var(--primary))" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[0.95rem] font-bold tracking-tight text-fg">Wanna Denia</span>
          <span className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-subtle">shittimchest.blog</span>
        </span>
      )}
    </span>
  );
}
