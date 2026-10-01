import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, Calendar, Clock, Eye, EyeOff, MessageSquare } from "lucide-react";
import { CommentBox } from "@/components/blog/CommentBox";
import { LikeBookmarkButtons } from "@/components/blog/LikeBookmarkButtons";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { PostCard, PostCover, Stars } from "@/components/blog/PostCard";
import { categoryElement, elementColor, rarity } from "@/lib/category-icons";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmt, formatDate, formatRelative, getDictionary } from "@/lib/i18n";
import { canEditPost, canModerate } from "@/lib/permissions";
import { extractHeadings, readingTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const getPost = cache(async (slug: string) =>
  prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, displayName: true, avatarUrl: true, bio: true } },
      category: { select: { id: true, name: true, slug: true, icon: true } },
      tags: { include: { tag: true } },
      comments: {
        where: { status: "VISIBLE" },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { displayName: true, avatarUrl: true } } },
        take: 50,
      },
      _count: { select: { likes: true, comments: { where: { status: "VISIBLE" } } } },
    },
  }),
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || post.status !== "PUBLISHED") return {};
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = getDictionary(locale);
  const [post, user] = await Promise.all([getPost(slug), getCurrentUserFromCookies()]);

  // Unpublished posts are visible to their author and to moderators only.
  const isPublished = post?.status === "PUBLISHED";
  if (!post || (!isPublished && !(user && (canModerate(user) || post.authorId === user.id)))) notFound();

  const [related, reactions] = await Promise.all([
    prisma.post.findMany({
      where: { status: "PUBLISHED", categoryId: post.categoryId, id: { not: post.id } },
      include: {
        author: { select: { displayName: true, avatarUrl: true } },
        category: { select: { name: true, slug: true, icon: true } },
        tags: { include: { tag: true } },
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
    }),
    user
      ? Promise.all([
          prisma.like.findUnique({ where: { postId_userId: { postId: post.id, userId: user.id } }, select: { id: true } }),
          prisma.bookmark.findUnique({ where: { postId_userId: { postId: post.id, userId: user.id } }, select: { id: true } }),
        ])
      : Promise.resolve([null, null] as const),
    isPublished ? prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }) : null,
  ]);

  const [liked, bookmarked] = reactions;
  const views = post.viewCount + (isPublished ? 1 : 0);
  const headings = extractHeadings(post.content);
  const minutes = readingTime(post.content);
  const canEdit = user ? canEditPost(user, post) : false;
  const element = categoryElement(post.category.slug);
  const elementHex = elementColor[element];

  return (
    <main className="pb-8">
      <ReadingProgress targetId="article-body" />

      {!isPublished ? (
        <div className="border-b border-warning/30 bg-warning/10">
          <p className="container-page flex items-center gap-2 py-3 text-sm font-medium text-warning">
            <EyeOff className="h-4 w-4 shrink-0" />
            {fmt(t.blog.previewNotice, { status: t.status[post.status] })}
          </p>
        </div>
      ) : null}

      <div className="container-page pt-10 sm:pt-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0">
        <header className="max-w-3xl animate-fade-up">
          <nav className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.18em] text-subtle" aria-label="Breadcrumb">
            <Link href={`/${locale}/blog`} className="inline-flex items-center gap-1.5 hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              {t.blog.backToBlog}
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`/${locale}/blog?category=${post.category.slug}`} className="truncate hover:text-primary" style={{ color: elementHex }}>
              {post.category.name}
            </Link>
          </nav>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Badge>{t.topicType[post.topicType]}</Badge>
            <Badge tone="neutral" style={{ color: elementHex, borderColor: `${elementHex}66` }}>
              {t.fx.elements[element]}
            </Badge>
            <Badge tone="neutral" className="uppercase">
              {post.language}
            </Badge>
            <span className="ml-1 flex items-center gap-2 font-display text-[0.65rem] uppercase tracking-[0.2em] text-subtle">
              {t.fx.rarity}
              <Stars count={rarity(post.difficulty)} />
              <span className="text-primary">{t.difficulty[post.difficulty]}</span>
            </span>
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold leading-[1.25] sm:text-4xl sm:leading-[1.22] lg:text-[2.6rem]">{post.title}</h1>
          {post.excerpt ? <p className="mt-5 border-l-2 border-primary/60 pl-4 text-lg leading-relaxed text-muted">{post.excerpt}</p> : null}

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-line/70 py-4 font-mono text-xs text-subtle">
            <span className="flex items-center gap-2.5">
              <Avatar name={post.author.displayName} src={post.author.avatarUrl} size="md" />
              <span className="font-sans text-sm font-semibold text-fg">{post.author.displayName}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <time dateTime={(post.publishedAt ?? post.createdAt).toISOString()}>{formatDate(post.publishedAt ?? post.createdAt, locale)}</time>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {fmt(t.common.minRead, { n: minutes })}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {fmt(t.common.views, { n: views })}
            </span>
            {canEdit ? (
              <Link
                href={`/${locale}/dashboard?tab=editor&edit=${encodeURIComponent(post.slug)}`}
                className={buttonClasses({ size: "sm", variant: "secondary", className: "ml-auto" })}
              >
                {t.common.edit}
              </Link>
            ) : null}
          </div>
        </header>

        {/* A real cover gets a cinematic frame; the generated fallback stays a slim banner. */}
        <div className="card mt-10 overflow-hidden">
          <div className={post.coverImage ? "aspect-[2/1] sm:aspect-[21/9]" : "aspect-[3/1] sm:aspect-[5/1]"}>
            <PostCover post={post} iconClassName={post.coverImage ? undefined : "h-14 w-14"} />
          </div>
        </div>

          <article id="article-body" className="mt-12 w-full min-w-0 max-w-3xl">
            {headings.length ? (
              <details className="card mb-8 p-4 lg:hidden">
                <summary className="cursor-pointer text-sm font-semibold text-fg">{t.blog.toc}</summary>
                <div className="mt-4">
                  <TableOfContents headings={headings} title={t.blog.toc} />
                </div>
              </details>
            ) : null}

            <MarkdownRenderer content={post.content} />

            {post.tags.length ? (
              <div className="mt-12 flex flex-wrap gap-2">
                {post.tags.map(({ tag }) => (
                  <Link
                    key={tag.id}
                    href={`/${locale}/blog?tag=${tag.slug}`}
                    className="border border-line bg-surface/70 px-3 py-1 font-mono text-xs text-muted transition hover:border-primary/60 hover:text-primary"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-8 border-t border-line pt-8">
              <LikeBookmarkButtons
                postId={post.id}
                signedIn={Boolean(user)}
                initialLiked={Boolean(liked)}
                initialBookmarked={Boolean(bookmarked)}
                likeCount={post._count.likes}
              />
            </div>

            <div className="card mt-10 flex gap-4 p-6">
              <Avatar name={post.author.displayName} src={post.author.avatarUrl} size="lg" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">{t.blog.writtenBy}</p>
                <p className="mt-1 font-display text-lg font-bold text-fg">{post.author.displayName}</p>
                {post.author.bio ? <p className="mt-1.5 text-sm leading-relaxed text-muted">{post.author.bio}</p> : null}
              </div>
            </div>

            <section className="mt-14" aria-labelledby="comments-title">
              <h2 id="comments-title" className="flex items-center gap-2 text-2xl font-bold">
                <MessageSquare className="h-6 w-6 text-primary" />
                {t.blog.comments}
                <span className="text-lg font-semibold text-subtle">({post._count.comments})</span>
              </h2>
              <div className="mt-6">
                {user && isPublished ? (
                  <CommentBox postId={post.id} userName={user.displayName} />
                ) : !user ? (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-line p-5">
                    <p className="text-sm text-muted">{t.blog.loginToComment}</p>
                    <Link href={`/${locale}/login`} className={buttonClasses({ size: "sm" })}>
                      {t.nav.login}
                    </Link>
                  </div>
                ) : null}
              </div>
              <ul className="mt-8 space-y-6">
                {post.comments.length ? (
                  post.comments.map((comment) => (
                    <li key={comment.id} className="flex gap-3">
                      <Avatar name={comment.author.displayName} src={comment.author.avatarUrl} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-semibold text-fg">{comment.author.displayName}</span>
                          <time className="text-xs text-subtle" dateTime={comment.createdAt.toISOString()}>
                            {formatRelative(comment.createdAt, locale)}
                          </time>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg/85">{comment.content}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-subtle">{t.blog.noComments}</li>
                )}
              </ul>
            </section>
          </article>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 pt-2">
            <TableOfContents headings={headings} title={t.blog.toc} />
          </div>
        </aside>
        </div>
      </div>

      {related.length ? (
        <section className="container-page mt-20 border-t border-line pt-14">
          <h2 className="text-2xl font-bold">{t.blog.related}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <PostCard key={item.id} locale={locale} post={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
