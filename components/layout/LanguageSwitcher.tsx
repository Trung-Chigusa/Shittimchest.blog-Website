"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Check, Languages } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { locales, type Locale } from "@/lib/locales";
import { useDismiss } from "@/lib/use-dismiss";
import { cn } from "@/lib/utils";

/** Same path, different locale — keeps the reader on the page they were viewing. */
export function useLocaleHref() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (target: Locale) => {
    const segments = pathname.split("/");
    segments[1] = target;
    const query = searchParams.toString();
    return `${segments.join("/") || `/${target}`}${query ? `?${query}` : ""}`;
  };
}

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const hrefFor = useLocaleHref();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold uppercase text-muted transition hover:bg-surface-2 hover:text-fg"
        aria-label={t.nav.language}
        aria-expanded={open}
      >
        <Languages className="h-4 w-4" />
        {locale}
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-50 w-44 animate-fade-in rounded-xl border border-line bg-surface p-1.5 shadow-lift">
          {locales.map((item) => (
            <Link
              key={item}
              href={hrefFor(item)}
              onClick={close}
              hrefLang={item}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-fg",
                item === locale && "text-fg",
              )}
            >
              <span className="w-6 text-[0.7rem] font-bold uppercase text-subtle">{item}</span>
              <span className="flex-1">{t.languages[item]}</span>
              {item === locale ? <Check className="h-4 w-4 text-primary" /> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
