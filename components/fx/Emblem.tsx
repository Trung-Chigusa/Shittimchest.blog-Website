import { cn } from "@/lib/utils";

/**
 * Original "resonance" emblem: concentric rings with tick marks around a diamond core.
 * Rings rotate slowly (disabled under reduced motion via global CSS).
 */
export function Emblem({ className, animated = true }: { className?: string; animated?: boolean }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i);
  return (
    <div className={cn("relative aspect-square", className)} aria-hidden="true">
      <svg viewBox="0 0 400 400" className={cn("absolute inset-0 h-full w-full", animated && "animate-spin-slower")}>
        <circle cx="200" cy="200" r="196" fill="none" stroke="rgb(var(--line))" strokeWidth="1" />
        {ticks.map((i) => {
          const long = i % 6 === 0;
          const angle = (i * 360) / 72;
          return (
            <line
              key={i}
              x1="200"
              y1={long ? 8 : 12}
              x2="200"
              y2="20"
              stroke={long ? "rgb(var(--primary))" : "rgb(var(--muted) / 0.5)"}
              strokeWidth={long ? 1.6 : 0.8}
              transform={`rotate(${angle} 200 200)`}
            />
          );
        })}
      </svg>
      <svg viewBox="0 0 400 400" className={cn("absolute inset-0 h-full w-full", animated && "animate-spin-rev")}>
        <circle cx="200" cy="200" r="150" fill="none" stroke="rgb(var(--primary) / 0.5)" strokeWidth="1" strokeDasharray="2 10" />
        <circle cx="200" cy="200" r="132" fill="none" stroke="rgb(var(--fg) / 0.15)" strokeWidth="1" />
        {[0, 90, 180, 270].map((angle) => (
          <rect
            key={angle}
            x="194"
            y="44"
            width="12"
            height="12"
            fill="rgb(var(--bg))"
            stroke="rgb(var(--primary))"
            strokeWidth="1.4"
            transform={`rotate(${angle} 200 200) rotate(45 200 50)`}
          />
        ))}
      </svg>
      <svg viewBox="0 0 400 400" className={cn("absolute inset-0 h-full w-full", animated && "animate-spin-slow")}>
        <path
          d="M200 92 A108 108 0 0 1 308 200"
          fill="none"
          stroke="rgb(var(--primary))"
          strokeWidth="2"
          strokeLinecap="square"
        />
        <path d="M200 308 A108 108 0 0 1 92 200" fill="none" stroke="rgb(var(--accent) / 0.7)" strokeWidth="1.2" />
      </svg>
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="emblem-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(255 245 214)" stopOpacity="0.95" />
            <stop offset="45%" stopColor="rgb(var(--primary))" stopOpacity="0.55" />
            <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="70" fill="url(#emblem-core)" opacity="0.35" />
        <path d="M200 140 L240 200 L200 260 L160 200 Z" fill="none" stroke="rgb(var(--primary))" strokeWidth="1.6" />
        <path d="M200 162 L226 200 L200 238 L174 200 Z" fill="rgb(var(--primary) / 0.18)" stroke="rgb(255 245 214 / 0.9)" strokeWidth="1" />
        <circle cx="200" cy="200" r="4" fill="rgb(255 245 214)" />
        <line x1="120" y1="200" x2="150" y2="200" stroke="rgb(var(--primary) / 0.8)" strokeWidth="1" />
        <line x1="250" y1="200" x2="280" y2="200" stroke="rgb(var(--primary) / 0.8)" strokeWidth="1" />
      </svg>
    </div>
  );
}
