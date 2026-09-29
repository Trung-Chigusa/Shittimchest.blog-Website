import { GitBranch, MessageCircle, RadioTower } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function Footer({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm text-slate-400 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-semibold text-white">Wanna Denia Team</p>
          <p className="mt-2 max-w-2xl">{dictionary.footer.line}</p>
          <p className="mt-4 text-xs">© {new Date().getFullYear()} Wanna Denia Team. {dictionary.footer.copyright}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LanguageSwitcher locale={locale} />
          <a className="rounded border border-white/10 p-2 text-slate-300 hover:text-cyan-200" href="#" aria-label="GitHub">
            <GitBranch className="h-4 w-4" />
          </a>
          <a className="rounded border border-white/10 p-2 text-slate-300 hover:text-cyan-200" href="#" aria-label="Discord">
            <MessageCircle className="h-4 w-4" />
          </a>
          <a className="rounded border border-white/10 p-2 text-slate-300 hover:text-cyan-200" href="#" aria-label="Status">
            <RadioTower className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
