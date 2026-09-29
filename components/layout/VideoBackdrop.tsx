/**
 * Ambient hero background: the team video, heavily tinted toward the page background so
 * text stays readable in both themes. Hidden on small screens to save mobile data.
 */
export function VideoBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <video
        className="absolute inset-0 hidden h-full w-full object-cover opacity-30 dark:opacity-40 sm:block"
        src="/videos/nen%20web.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/80 to-bg" />
      <div className="aurora absolute inset-0" />
      <div className="grid-fade absolute inset-0 opacity-60" />
    </div>
  );
}
