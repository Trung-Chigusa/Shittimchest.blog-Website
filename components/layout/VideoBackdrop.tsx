/**
 * Ambient hero background: the team video, tinted toward the page background so text
 * stays readable. Hidden on small screens to save mobile data.
 */
export function VideoBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <video
        className="absolute inset-0 hidden h-full w-full object-cover opacity-25 mix-blend-luminosity sm:block"
        src="/videos/nen%20web.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-bg/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/60" />
      <div className="aurora absolute inset-0" />
      <div className="grid-fade absolute inset-0 opacity-60" />
    </div>
  );
}
