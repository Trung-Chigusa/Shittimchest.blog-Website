import Link from "next/link";
import { Bookmark, FileText, LayoutDashboard, PenSquare, UserRound, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { fmt, getDictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { levelFromXp } from "@/lib/xp";

export const dashboardTabs = ["overview", "posts", "editor", "bookmarks", "profile"] as const;
export type DashboardTab = (typeof dashboardTabs)[number];

const tabIcons: Record<DashboardTab, LucideIcon> = {
  overview: LayoutDashboard,
  posts: FileText,
  editor: PenSquare,
  bookmarks: Bookmark,
  profile: UserRound,
};

export function DashboardShell({
  locale,
  tab,
  user,
  xp,
  children,
}: {
  locale: string;
  tab: DashboardTab;
  user: { displayName: string; email: string; role: string; avatarUrl: string | null };
  xp: number;
  children: React.ReactNode;
}) {
  const t = getDictionary(locale);
  const level = levelFromXp(xp);
  const labels: Record<DashboardTab, string> = {
    overview: t.dashboard.overview,
    posts: t.dashboard.myPosts,
    editor: t.dashboard.newPost,
    bookmarks: t.dashboard.bookmarks,
    profile: t.dashboard.profile,
  };

  return (
    <main className="container-page py-10 sm:py-12">
      {/* Resonator profile card */}
      <header className="card relative overflow-hidden p-6 sm:p-8">
        <div className="aurora absolute inset-0 -z-10 opacity-80" />
        <div className="gold-line absolute inset-x-0 top-0 h-px" />
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative">
            <Avatar name={user.displayName} src={user.avatarUrl} size="lg" />
            <span className="absolute -bottom-2 -right-3 grid h-8 w-8 place-items-center">
              <span className="absolute inset-0 rotate-45 border border-primary bg-bg" />
              <span className="relative font-display text-xs font-bold text-primary">{level.level}</span>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="hud-title truncate text-xl sm:text-2xl">{fmt(t.dashboard.welcome, { name: user.displayName })}</h1>
              <Badge tone="halo">{user.role}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{t.dashboard.subtitle}</p>
            <div className="mt-4 max-w-md">
              <div className="flex items-baseline justify-between font-display text-[0.65rem] uppercase tracking-[0.25em]">
                <span className="text-primary">
                  {t.fx.level} {level.level}
                </span>
                <span className="font-mono normal-case tracking-normal text-subtle">
                  {level.xp} / {level.ceiling} XP
                </span>
              </div>
              <div className="relative mt-2 h-2 border border-line/80 bg-bg/70">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/60 to-primary shadow-[0_0_14px_rgb(var(--primary)/0.7)]"
                  style={{ width: `${Math.max(3, level.progress * 100)}%` }}
                />
                {[0.25, 0.5, 0.75].map((mark) => (
                  <span key={mark} className="absolute inset-y-0 w-px bg-bg/80" style={{ left: `${mark * 100}%` }} />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-subtle">
                {fmt(t.fx.nextLevel, { n: level.toNext })} · {t.fx.xpRules}
              </p>
            </div>
          </div>
          {tab !== "editor" ? (
            <Link href={`/${locale}/dashboard?tab=editor`} className={buttonClasses()}>
              <PenSquare />
              {t.dashboard.newPost}
            </Link>
          ) : null}
        </div>
      </header>

      <nav className="-mx-4 mt-8 overflow-x-auto border-b border-line/70 px-4 scrollbar-none sm:mx-0 sm:px-0" aria-label="Dashboard">
        <ul className="flex min-w-max gap-1">
          {dashboardTabs.map((key) => {
            const Icon = tabIcons[key];
            const active = key === tab;
            return (
              <li key={key}>
                <Link
                  href={`/${locale}/dashboard${key === "overview" ? "" : `?tab=${key}`}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 px-4 pb-3 pt-2 font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:text-fg",
                    active && "text-primary hover:text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {labels[key]}
                  {active ? <span className="absolute inset-x-2 -bottom-px h-px bg-primary shadow-[0_0_10px_rgb(var(--primary))]" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-8">{children}</div>
    </main>
  );
}
