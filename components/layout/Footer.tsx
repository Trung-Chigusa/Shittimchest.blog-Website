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
    <footer className="relative mt-28 overflow-hidden border-t border-line/60 bg-bg/80">
      <div className="gold-line absolute inset-x-0 top-0 h-px opacity-60" />
      <span
        className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[clamp(4rem,14vw,11rem)] font-bold uppercase leading-none tracking-[0.08em] text-fg/[0.025]"
        aria-hidden="true"
      >
        Wanna Denia
      </span>
      <div className="container-page relative grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 text-sm leading-relaxed text-muted">{t.footer.line}</p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 border border-line px-3 py-1.5 font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-primary hover:text-primary"
          >
            <GithubIcon className="h-4 w-4" />
            {t.footer.source}
          </a>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="eyebrow">{column.title}</p>
            <ul className="mt-5 space-y-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="group inline-flex items-center gap-2 text-sm text-muted transition hover:text-primary">
                    <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="relative border-t border-line/60">
        <div className="container-page flex flex-col gap-2 py-5 font-mono text-[11px] text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. {t.footer.copyright}
          </p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse bg-success" />
            LINK STABLE · shittimchest.blog
          </p>
        </div>
      </div>
    </footer>
  );
}
