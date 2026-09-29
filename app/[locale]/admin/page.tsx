import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, FilePen, FileText, Users, type LucideIcon } from "lucide-react";
import { AdminPanel } from "@/components/dashboard/AdminPanel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, getDictionary } from "@/lib/i18n";
import { canManageUsers, canModerate } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).nav.admin, robots: { index: false } };
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);
  const user = await getCurrentUserFromCookies();
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/admin`)}`);
  if (!canModerate(user)) redirect(`/${locale}/dashboard`);
  const isAdmin = canManageUsers(user);

  const [totalUsers, totalPosts, publishedPosts, pendingPosts, draftPosts, posts, members] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.post.count({ where: { status: "PENDING" } }),
    prisma.post.count({ where: { status: "DRAFT" } }),
    prisma.post.findMany({
      include: {
        author: { select: { displayName: true, email: true } },
        category: { select: { name: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
    }),
    isAdmin
      ? prisma.user.findMany({
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
            _count: { select: { posts: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : Promise.resolve([]),
  ]);

  const stats: [string, number, LucideIcon, string][] = [
    [t.admin.users, totalUsers, Users, "bg-primary/10 text-primary"],
    [t.dashboard.statTotal, totalPosts, FileText, "bg-accent/10 text-accent"],
    [t.dashboard.statPublished, publishedPosts, CheckCircle2, "bg-success/10 text-success"],
    [t.dashboard.statPending, pendingPosts, Clock, "bg-warning/10 text-warning"],
    [t.dashboard.statDrafts, draftPosts, FilePen, "bg-halo/10 text-halo"],
  ];

  return (
    <main className="container-page space-y-8 py-10 sm:py-12">
      <header>
        <p className="eyebrow">{t.admin.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold">{t.admin.title}</h1>
        <p className="mt-2 text-muted">{t.admin.subtitle}</p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map(([label, value, Icon, tone]) => (
          <div key={label} className="card p-5">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <p className="mt-4 font-display text-3xl font-bold tabular-nums text-fg">{value}</p>
            <p className="mt-0.5 text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>

      <AdminPanel
        posts={posts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          language: post.language,
          updatedAt: post.updatedAt.toISOString(),
          author: post.author,
          category: post.category,
        }))}
      />

      {isAdmin && members.length ? (
        <section className="card overflow-hidden">
          <h2 className="border-b border-line px-5 py-4 text-lg font-bold">
            {t.admin.users} <span className="text-subtle">({totalUsers})</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface-2/60 text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t.auth.displayName}</th>
                  <th className="px-3 py-3 font-semibold">{t.dashboard.role}</th>
                  <th className="px-3 py-3 font-semibold">{t.dashboard.myPosts}</th>
                  <th className="px-3 py-3 font-semibold">{t.dashboard.memberSince}</th>
                  <th className="px-5 py-3 font-semibold">{t.dashboard.lastLogin}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {members.map((member) => (
                  <tr key={member.id} className="transition hover:bg-surface-2/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.displayName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-fg">{member.displayName}</p>
                          <p className="truncate text-xs text-subtle">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={member.role === "ADMIN" ? "halo" : member.role === "USER" ? "neutral" : "primary"}>{member.role}</Badge>
                      {member.status !== "ACTIVE" ? (
                        <Badge tone="danger" className="ml-1.5">
                          {member.status}
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-muted">{member._count.posts}</td>
                    <td className="px-3 py-3 text-muted">{formatDate(member.createdAt, locale)}</td>
                    <td className="px-5 py-3 text-muted">{member.lastLoginAt ? formatDate(member.lastLoginAt, locale) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
