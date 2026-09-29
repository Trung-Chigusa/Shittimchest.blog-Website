import { CheckCircle2 } from "lucide-react";
import { LogoMark } from "@/components/layout/Logo";
import { getDictionary } from "@/lib/i18n";

/** Split layout for auth pages: brand panel on large screens, focused form everywhere. */
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
    <main className="container-page grid min-h-[calc(100vh-4rem)] items-center gap-12 py-12 lg:grid-cols-2 lg:py-16">
      <aside className="relative isolate hidden h-full min-h-[560px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2a66] via-primary to-accent p-10 text-white shadow-lift lg:flex lg:flex-col lg:justify-between">
        <div className="grid-fade absolute inset-0 -z-10 opacity-40" />
        <div className="absolute -right-20 top-16 -z-10 h-24 w-80 -rotate-12 rounded-[50%] border-[6px] border-white/25" />
        <div className="absolute -bottom-24 -left-10 -z-10 h-80 w-80 rounded-full bg-halo/40 blur-3xl" />
        <div className="flex items-center gap-3">
          <LogoMark className="bg-white/15 from-white/20 to-white/5 shadow-none" />
          <span className="font-display text-lg font-bold">Wanna Denia Team</span>
        </div>
        <div>
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">{t.auth.panelTitle}</h2>
          <ul className="mt-8 space-y-4">
            {t.auth.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-3 text-white/90">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                {perk}
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-xs text-white/60">shittimchest.blog</p>
      </aside>

      <div className="mx-auto w-full max-w-md animate-fade-up">
        <div className="lg:hidden">
          <LogoMark />
        </div>
        <h1 className="mt-6 text-3xl font-bold lg:mt-0">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-8 text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </main>
  );
}
