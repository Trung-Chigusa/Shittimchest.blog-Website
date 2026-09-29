import Link from "next/link";
import { getDictionary, type Locale } from "@/lib/i18n";
import { Logo } from "@/components/layout/Logo";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { REPO_URL, SITE_NAME } from "@/lib/site";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const columns = [
    {
      title: t.footer.explore,
      links: [
        { href: `/${locale}`, label: t.nav.home },
        { href: `/${locale}/blog`, label: t.nav.blog },
        { href: `/${locale}/blog?sort=popular`, label: t.blog.popular },
      ],
    },
    {
      title: t.footer.account,
      links: [
        { href: `/${locale}/login`, label: t.nav.login },
        { href: `/${locale}/register`, label: t.nav.register },
        { href: `/${locale}/dashboard`, label: t.nav.dashboard },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-line bg-surface/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">{t.footer.line}</p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-primary/40 hover:text-fg"
          >
            <GithubIcon className="h-4 w-4" />
            {t.footer.source}
          </a>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">{column.title}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. {t.footer.copyright}
          </p>
          <p className="font-mono">shittimchest.blog</p>
        </div>
      </div>
    </footer>
  );
}
