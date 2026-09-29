/** Skeleton shown while a page's server data loads. */
export default function LocaleLoading() {
  return (
    <main className="container-page py-12" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-28 animate-pulse rounded-full bg-surface-2" />
      <div className="mt-4 h-10 w-2/3 max-w-lg animate-pulse rounded-xl bg-surface-2" />
      <div className="mt-3 h-4 w-1/2 max-w-md animate-pulse rounded-full bg-surface-2" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="card overflow-hidden">
            <div className="aspect-[16/9] animate-pulse bg-surface-2" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-20 animate-pulse rounded-full bg-surface-2" />
              <div className="h-5 w-4/5 animate-pulse rounded-lg bg-surface-2" />
              <div className="h-3 w-full animate-pulse rounded-full bg-surface-2" />
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
