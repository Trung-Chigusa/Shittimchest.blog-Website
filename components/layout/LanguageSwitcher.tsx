import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ locale, path = "" }: { locale: Locale; path?: string }) {
  return (
    <div className="inline-flex rounded-md border border-white/10 bg-white/5 p-1">
      {locales.map((item) => (
        <Link
          key={item}
          href={`/${item}${path}`}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-semibold uppercase text-slate-300 transition hover:text-white",
            locale === item && "bg-cyan-300 text-slate-950 hover:text-slate-950",
          )}
        >
          {item}
        </Link>
      ))}
    </div>
  );
}
