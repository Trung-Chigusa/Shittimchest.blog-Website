import { cn, hueFromString, initials } from "@/lib/utils";

const sizes = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-16 w-16 text-lg",
};

/** Portrait tile with chamfered corners, like a character frame. */
export function Avatar({
  name,
  src,
  size = "sm",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const hue = hueFromString(name);
  return (
    <span
      aria-hidden="true"
      className={cn("cut-sm relative grid shrink-0 place-items-center overflow-hidden font-display font-bold text-white", sizes[size], className)}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 55% 42%), hsl(${(hue + 50) % 360} 60% 22%))`,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="relative tracking-wider drop-shadow">{initials(name)}</span>
      )}
      <span className="pointer-events-none absolute inset-0 border border-primary/40" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-primary" />
    </span>
  );
}
