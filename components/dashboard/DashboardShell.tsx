import Link from "next/link";
import { Bookmark, FileText, LayoutDashboard, PenSquare, UserRound, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { fmt, getDictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
  children,
}: {
  locale: string;
  tab: DashboardTab;
  user: { displayName: string; email: string; role: string; avatarUrl: string | null };
  children: React.ReactNode;
}) {
  const t = getDictionary(locale);
  const labels: Record<DashboardTab, string> = {
    overview: t.dashboard.overview,
    posts: t.dashboard.myPosts,
    editor: t.dashboard.newPost,
    bookmarks: t.dashboard.bookmarks,
    profile: t.dashboard.profile,
  };

  return (
    <main className="container-page py-10 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Avatar name={user.displayName} src={user.avatarUrl} size="lg" />
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold sm:text-3xl">
              {fmt(t.dashboard.welcome, { name: user.displayName })}
              <Badge tone="halo" className="align-middle">
                {user.role}
              </Badge>
            </h1>
            <p className="mt-1 text-sm text-muted">{t.dashboard.subtitle}</p>
          </div>
        </div>
        {tab !== "editor" ? (
          <Link href={`/${locale}/dashboard?tab=editor`} className={buttonClasses()}>
            <PenSquare />
            {t.dashboard.newPost}
          </Link>
        ) : null}
      </header>

      <nav className="-mx-4 mt-8 overflow-x-auto border-b border-line px-4 scrollbar-none sm:mx-0 sm:px-0" aria-label="Dashboard">
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
                    "relative flex items-center gap-2 px-3.5 pb-3 pt-2 text-sm font-medium text-muted transition hover:text-fg",
                    active && "text-primary hover:text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {labels[key]}
                  {active ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" /> : null}
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
