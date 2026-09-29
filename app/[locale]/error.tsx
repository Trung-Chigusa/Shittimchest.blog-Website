"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";

export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="container-page grid min-h-[65vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger">
          <TriangleAlert className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">{t.error.title}</h1>
        <p className="mt-2 text-muted">{t.error.body}</p>
        <Button className="mt-8" onClick={() => reset()}>
          <RotateCcw />
          {t.common.retry}
        </Button>
      </div>
    </main>
  );
}
