export default function LocaleLoading() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4">
      <div className="glass-panel flex items-center gap-3 px-5 py-4 text-sm text-cyan-100">
        <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-200 shadow-glow" />
        Loading...
      </div>
    </main>
  );
}
