"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold">Có lỗi xảy ra · Something went wrong</h1>
        <p className="mt-2 text-muted">Vui lòng thử lại sau giây lát. · Please try again in a moment.</p>
        <Button className="mt-8" onClick={() => reset()}>
          Thử lại · Retry
        </Button>
      </div>
    </main>
  );
}
