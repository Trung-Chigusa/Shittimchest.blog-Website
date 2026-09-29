import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { CommentBox } from "@/components/blog/CommentBox";
import { LikeBookmarkButtons } from "@/components/blog/LikeBookmarkButtons";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { PostCard } from "@/components/blog/PostCard";
import { prisma } from "@/lib/db";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { canModerate } from "@/lib/permissions";
import { formatDate, readingTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BlogDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const user = await getCurrentUserFromCookies();
  const canPreviewUnpublished = user ? canModerate(user) : false;

  const post = await prisma.post.findFirst({
    where: canPreviewUnpublished ? { slug } : { slug, status: "PUBLISHED" },
    include: {
      author: { select: { displayName: true, avatarUrl: true, bio: true } },
      category: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: true } },
      comments: {
        where: { status: "VISIBLE" },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { displayName: true } } },
        take: 20,
      },
    },
  });

  if (!post) notFound();

  if (post.status === "PUBLISHED") {
    await prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } });
  }
  const displayedViewCount = post.status === "PUBLISHED" ? post.viewCount + 1 : post.viewCount;

  const related = await prisma.post.findMany({
    where: { status: "PUBLISHED", categoryId: post.categoryId, id: { not: post.id } },
    include: {
      author: { select: { displayName: true } },
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: true } },
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });

  const headings = post.content
    .split("\n")
    .filter((line) => /^#{2,3}\s/.test(line))
    .map((line) => line.replace(/^#{2,3}\s/, "").trim())
    .slice(0, 8);

  return (
    <main className="section-shell grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
      <article className="space-y-6">
        <div className="overflow-hidden rounded-md border border-white/10 bg-slate-950/45">
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImage} alt="" className="aspect-[21/9] w-full object-cover" />
          ) : null}
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              <Badge>{post.category.name}</Badge>
              <Badge className="border-violet-200/25 bg-violet-200/10 text-violet-100">{post.language.toUpperCase()}</Badge>
              {post.tags.map(({ tag }) => (
                <Badge key={tag.id} className="border-white/10 bg-white/5 text-slate-200">
                  #{tag.name}
                </Badge>
              ))}
            </div>
            <h1 className="mt-5 text-4xl font-black text-white sm:text-5xl">{post.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{post.excerpt}</p>
            <p className="mt-5 text-sm text-slate-400">
              {post.author.displayName} · {formatDate(post.publishedAt)} · {readingTime(post.content)} min read · {displayedViewCount} views
            </p>
          </div>
        </div>
        <div className="glass-panel p-5 sm:p-8">
          <MarkdownRenderer content={post.content} />
        </div>
        <LikeBookmarkButtons postId={post.id} />
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Comments</h2>
          {user ? <CommentBox postId={post.id} /> : <p className="glass-panel p-4 text-slate-400">Login to comment, like, or bookmark.</p>}
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="rounded-md border border-white/10 bg-slate-950/45 p-4">
                <p className="font-medium text-white">{comment.author.displayName}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{comment.content}</p>
              </div>
            ))}
          </div>
        </section>
        {related.length ? (
          <section>
            <h2 className="text-2xl font-semibold text-white">Related posts</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {related.map((item) => (
                <PostCard key={item.id} locale={locale} post={item} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
      <aside className="space-y-4">
        <div className="glass-panel sticky top-24 p-5">
          <p className="cyber-label">Table of contents</p>
          <div className="mt-4 space-y-2">
            {headings.length ? headings.map((heading) => <p key={heading} className="text-sm text-slate-300">{heading}</p>) : <p className="text-sm text-slate-500">No headings yet.</p>}
          </div>
        </div>
      </aside>
    </main>
  );
}
