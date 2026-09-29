export function VideoBackdrop({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <video
        className="h-full w-full object-cover opacity-55"
        src="/videos/nen web.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-slate-950/70" />
      <div className="absolute inset-0 bg-grid bg-[length:38px_38px] opacity-25" />
      <div
        className={
          compact
            ? "absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent"
            : "absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent"
        }
      />
    </div>
  );
}
