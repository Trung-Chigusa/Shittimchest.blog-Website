"use client";

import { Button } from "@/components/ui/Button";

export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div className="glass-panel max-w-lg p-8">
        <p className="cyber-label">Error</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Unable to load this view</h1>
        <p className="mt-3 text-slate-400">The request failed gracefully. Please retry.</p>
        <Button className="mt-6" onClick={() => reset()}>
          Retry
        </Button>
      </div>
    </main>
  );
}
