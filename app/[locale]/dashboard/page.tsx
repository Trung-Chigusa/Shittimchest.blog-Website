import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Bookmark, CheckCircle2, Clock, FilePen, FileText, KeyRound, ShieldCheck, type LucideIcon } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { DashboardShell, dashboardTabs, type DashboardTab } from "@/components/dashboard/DashboardShell";
import { MyPostsList, type DashboardPost } from "@/components/dashboard/MyPostsList";
import { PostEditor } from "@/components/dashboard/PostEditor";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, getDictionary } from "@/lib/i18n";
import { canEditPost, canPublishDirectly, canModerate } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).nav.dashboard, robots: { index: false } };
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const t = getDictionary(locale);
  const user = await getCurrentUserFromCookies();
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/dashboard`)}`);
  if (user.status !== "ACTIVE") redirect(`/${locale}`);

  const rawTab = typeof query.tab === "string" ? query.tab : "overview";
  const tab: DashboardTab = (dashboardTabs as readonly string[]).includes(rawTab) ? (rawTab as DashboardTab) : "overview";
  const editSlug = typeof query.edit === "string" ? query.edit : null;

  const shellUser = { displayName: user.displayName, email: user.email, role: user.role, avatarUrl: user.avatarUrl };

  const postRows = await prisma.post.findMany({
    where: { authorId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      language: true,
      updatedAt: true,
      viewCount: true,
      rejectionReason: true,
      category: { select: { name: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });
  const posts: DashboardPost[] = postRows.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    language: post.language,
    updatedAt: post.updatedAt.toISOString(),
    viewCount: post.viewCount,
    rejectionReason: post.rejectionReason,
    category: post.category.name,
    likes: post._count.likes,
    comments: post._count.comments,
  }));

  let content: React.ReactNode;

  if (tab === "editor") {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
    let editable = null;
    if (editSlug) {
      const existing = await prisma.post.findUnique({ where: { slug: editSlug }, include: { tags: { include: { tag: true } } } });
      if (!existing || !canEditPost(user, existing)) notFound();
      editable = {
        slug: existing.slug,
        title: existing.title,
        excerpt: existing.excerpt,
        content: existing.content,
        coverImage: existing.coverImage,
        categoryId: existing.categoryId,
        tags: existing.tags.map(({ tag }) => tag.name),
        language: existing.language,
        difficulty: existing.difficulty,
        topicType: existing.topicType,
        status: existing.status,
        seoTitle: existing.seoTitle,
        seoDescription: existing.seoDescription,
      };
    }
    content = (
      <>
        <h2 className="mb-5 text-xl font-bold">{editable ? t.dashboard.editorEdit : t.dashboard.editorNew}</h2>
        <PostEditor
          key={editable?.slug ?? "new"}
          categories={categories}
          post={editable}
          canPublish={canPublishDirectly(user) || canModerate(user)}
        />
      </>
    );
  } else if (tab === "posts") {
    content = (
      <div className="card p-5 sm:p-6">
        {posts.length ? <MyPostsList posts={posts} /> : <NoPosts locale={locale} />}
      </div>
    );
  } else if (tab === "bookmarks") {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id, post: { status: "PUBLISHED" } },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          include: {
            author: { select: { displayName: true, avatarUrl: true } },
            category: { select: { name: true, slug: true, icon: true } },
            tags: { include: { tag: true } },
          },
        },
      },
    });
    content = bookmarks.length ? (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {bookmarks.map(({ post }) => (
          <PostCard key={post.id} locale={locale} post={post} />
        ))}
      </div>
    ) : (
      <EmptyState
        icon={Bookmark}
        title={t.dashboard.bookmarks}
        body={t.dashboard.emptyBookmarks}
        action={
          <Link href={`/${locale}/blog`} className={buttonClasses({ variant: "secondary" })}>
            {t.hero.readBlog}
          </Link>
        }
      />
    );
  } else if (tab === "profile") {
    const rows: [string, React.ReactNode][] = [
      [t.auth.displayName, user.displayName],
      [t.dashboard.email, user.email],
      [t.dashboard.role, user.role],
      [t.dashboard.memberSince, formatDate(user.createdAt, locale)],
      [t.dashboard.lastLogin, user.lastLoginAt ? formatDate(user.lastLoginAt, locale) : "—"],
    ];
    content = (
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-lg font-bold">{t.dashboard.profile}</h2>
          <dl className="mt-4 divide-y divide-line">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-3 text-sm">
                <dt className="text-muted">{label}</dt>
                <dd className="truncate font-medium text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="card p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-success/10 text-success">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-bold">{t.dashboard.security}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t.dashboard.securityBody}</p>
          <Link href={`/${locale}/forgot-password`} className={buttonClasses({ variant: "secondary", className: "mt-5" })}>
            <KeyRound />
            {t.dashboard.changePassword}
          </Link>
        </section>
      </div>
    );
  } else {
    const count = (status: DashboardPost["status"]) => posts.filter((post) => post.status === status).length;
    const stats: [string, number, LucideIcon, string][] = [
      [t.dashboard.statTotal, posts.length, FileText, "bg-primary/10 text-primary"],
      [t.dashboard.statPublished, count("PUBLISHED"), CheckCircle2, "bg-success/10 text-success"],
      [t.dashboard.statPending, count("PENDING"), Clock, "bg-warning/10 text-warning"],
      [t.dashboard.statDrafts, count("DRAFT"), FilePen, "bg-halo/10 text-halo"],
    ];
    content = (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t.dashboard.recent}</h2>
            {posts.length > 5 ? (
              <Link href={`/${locale}/dashboard?tab=posts`} className="text-sm font-semibold text-primary hover:underline">
                {t.home.viewAll}
              </Link>
            ) : null}
          </div>
          {posts.length ? <MyPostsList posts={posts.slice(0, 5)} compact /> : <NoPosts locale={locale} />}
        </section>
      </div>
    );
  }

  return (
    <DashboardShell locale={locale} tab={tab} user={shellUser}>
      {content}
    </DashboardShell>
  );
}

function NoPosts({ locale }: { locale: string }) {
  const t = getDictionary(locale);
  return (
    <EmptyState
      icon={FilePen}
      title={t.dashboard.emptyPosts}
      action={
        <Link href={`/${locale}/dashboard?tab=editor`} className={buttonClasses()}>
          {t.dashboard.emptyPostsCta}
        </Link>
      }
    />
  );
}
