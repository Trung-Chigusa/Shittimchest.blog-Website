"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div className="glass-panel max-w-lg p-8">
        <p className="cyber-label">Runtime error</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Something broke cleanly</h1>
        <p className="mt-3 text-slate-400">No sensitive stack trace is shown here. Try again in a moment.</p>
        <Button className="mt-6" onClick={() => reset()}>
          Retry
        </Button>
      </div>
    </main>
  );
}
