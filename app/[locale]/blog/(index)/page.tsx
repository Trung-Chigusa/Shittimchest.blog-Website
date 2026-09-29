import type { Metadata } from "next";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { SearchX } from "lucide-react";
import { Pagination } from "@/components/blog/Pagination";
import { PostCard } from "@/components/blog/PostCard";
import { PostFilters } from "@/components/blog/PostFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/lib/db";
import { fmt, getDictionary } from "@/lib/i18n";
import { postQuerySchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(locale);
  return { title: t.blog.title, description: t.blog.subtitle };
}

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, raw] = await Promise.all([params, searchParams]);
  const t = getDictionary(locale);
  const parsed = postQuerySchema.safeParse({
    search: first(raw.search) || undefined,
    category: first(raw.category) || undefined,
    tag: first(raw.tag) || undefined,
    language: first(raw.language) || "all",
    sort: first(raw.sort) || "latest",
    page: first(raw.page) || 1,
  });
  // Bad query strings (e.g. ?page=abc) fall back to defaults instead of crashing the page.
  const query = parsed.success ? parsed.data : postQuerySchema.parse({});

  const where: Prisma.PostWhereInput = {
    status: "PUBLISHED",
    ...(query.language !== "all" ? { language: query.language } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { excerpt: { contains: query.search, mode: "insensitive" } },
            { content: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.tag ? { tags: { some: { tag: { slug: query.tag } } } } : {}),
  };

  const pageSize = 9;
  const [posts, total, categories, tags] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { displayName: true, avatarUrl: true } },
        category: { select: { name: true, slug: true, icon: true } },
        tags: { include: { tag: true } },
      },
      orderBy: query.sort === "popular" ? [{ viewCount: "desc" }, { publishedAt: "desc" }] : { publishedAt: "desc" },
      skip: (query.page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.tag.findMany({
      where: { posts: { some: { post: { status: "PUBLISHED" } } } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="container-page py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">{t.blog.eyebrow}</p>
        <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{t.blog.title}</h1>
        <p className="mt-4 text-lg text-muted">{t.blog.subtitle}</p>
      </header>

      <div className="mt-10">
        <Suspense>
          <PostFilters categories={categories} tags={tags} />
        </Suspense>
      </div>

      <p className="mt-8 text-sm font-medium text-subtle" aria-live="polite">
        {fmt(t.blog.results, { n: total })}
      </p>

      {posts.length ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} locale={locale} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState className="mt-4" icon={SearchX} title={t.blog.emptyTitle} body={t.blog.emptyBody} />
      )}

      <div className="mt-12">
        <Pagination
          page={query.page}
          pageCount={pageCount}
          params={{
            search: query.search,
            category: query.category,
            tag: query.tag,
            language: query.language !== "all" ? query.language : undefined,
            sort: query.sort !== "latest" ? query.sort : undefined,
          }}
          labels={{ previous: t.common.previous, next: t.common.next }}
        />
      </div>
    </main>
  );
}
