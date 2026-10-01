import { Emblem } from "@/components/fx/Emblem";
import { LogoMark } from "@/components/layout/Logo";
import { getDictionary } from "@/lib/i18n";

/** Game-style "link terminal": emblem art on large screens, framed form everywhere. */
export function AuthShell({
  locale,
  title,
  subtitle,
  children,
  footer,
}: {
  locale: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const t = getDictionary(locale);
  return (
    <main className="container-page grid min-h-[calc(100vh-4rem)] items-center gap-12 py-12 lg:grid-cols-[1.1fr_1fr] lg:py-16">
      <aside className="relative hidden h-full min-h-[600px] flex-col justify-between overflow-hidden lg:flex">
        <Emblem className="absolute left-1/2 top-1/2 w-[34rem] -translate-x-1/2 -translate-y-1/2 opacity-90" />
        <div className="relative flex items-center gap-3">
          <LogoMark />
          <span className="font-display text-sm font-bold uppercase tracking-[0.3em]">Wanna Denia</span>
        </div>
        <div className="relative max-w-sm bg-bg/40 p-1 backdrop-blur-sm">
          <h2 className="hud-title text-2xl leading-snug">{t.auth.panelTitle}</h2>
          <ul className="mt-6 space-y-3">
            {t.auth.perks.map((perk, index) => (
              <li key={perk} className="flex items-start gap-3 text-sm text-muted">
                <span className="mt-0.5 font-mono text-[11px] text-primary">{String(index + 1).padStart(2, "0")}</span>
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="mx-auto w-full max-w-md animate-fade-up">
        <div className="card relative overflow-hidden p-7 sm:p-9">
          <div className="gold-line absolute inset-x-0 top-0 h-px" />
          <p className="eyebrow">Resonance link</p>
          <h1 className="hud-title mt-4 text-2xl sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
        {footer ? <div className="mt-6 text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </main>
  );
}
