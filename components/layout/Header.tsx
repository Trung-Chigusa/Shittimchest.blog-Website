import Link from "next/link";
import { ShieldCheck, Terminal } from "lucide-react";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { getDictionary, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { LogoutButton } from "@/components/auth/LogoutButton";

export async function Header({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const user = await getCurrentUserFromCookies();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={`/${locale}`} className="flex min-w-0 items-center gap-2 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-md border border-cyan-200/40 bg-cyan-200/10 shadow-glow">
            <ShieldCheck className="h-5 w-5 text-cyan-200" aria-hidden="true" />
          </span>
          <span className="truncate font-semibold">Wanna Denia Team</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link className="rounded px-3 py-2 text-sm text-slate-300 hover:bg-white/8 hover:text-white" href={`/${locale}`}>
            {dictionary.nav.home}
          </Link>
          <Link className="rounded px-3 py-2 text-sm text-slate-300 hover:bg-white/8 hover:text-white" href={`/${locale}/blog`}>
            {dictionary.nav.blog}
          </Link>
          <Link
            className="rounded px-3 py-2 text-sm text-slate-300 hover:bg-white/8 hover:text-white"
            href={`/${locale}/dashboard`}
          >
            {dictionary.nav.dashboard}
          </Link>
          {user?.role === "ADMIN" || user?.role === "MODERATOR" ? (
            <Link className="rounded px-3 py-2 text-sm text-slate-300 hover:bg-white/8 hover:text-white" href={`/${locale}/admin`}>
              {dictionary.nav.admin}
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} />
          {user ? (
            <LogoutButton label={dictionary.nav.logout} locale={locale} />
          ) : (
            <Link href={`/${locale}/login`}>
              <Button variant="secondary" className="h-9 px-3">
                <Terminal className="h-4 w-4" aria-hidden="true" />
                {dictionary.nav.login}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
