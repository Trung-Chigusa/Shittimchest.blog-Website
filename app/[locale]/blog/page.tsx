import type { Prisma } from "@prisma/client";
import { PostCard } from "@/components/blog/PostCard";
import { PostFilters } from "@/components/blog/PostFilters";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { postQuerySchema } from "@/lib/validators";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
  const [{ locale }, rawSearchParams] = await Promise.all([params, searchParams]);
  const dictionary = getDictionary(locale);
  const query = postQuerySchema.parse({
    search: first(rawSearchParams.search),
    category: first(rawSearchParams.category),
    tag: first(rawSearchParams.tag),
    language: first(rawSearchParams.language) ?? "all",
    sort: first(rawSearchParams.sort) ?? "latest",
    page: first(rawSearchParams.page) ?? 1,
  });

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
        author: { select: { displayName: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: true } },
      },
      orderBy: query.sort === "popular" ? { viewCount: "desc" } : { publishedAt: "desc" },
      skip: (query.page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="section-shell space-y-8 py-10">
      <div>
        <p className="cyber-label">Public Knowledge Base</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">{dictionary.blog.title}</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Everyone can read published writeups without logging in.</p>
      </div>
      <PostFilters
        dictionary={dictionary.blog}
        categories={categories}
        tags={tags}
        defaults={{
          search: query.search,
          category: query.category,
          tag: query.tag,
          language: query.language,
          sort: query.sort,
        }}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} locale={locale} post={post} />
        ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        {query.page > 1 ? (
          <Link href={`?page=${query.page - 1}`}>
            <Button variant="secondary">Previous</Button>
          </Link>
        ) : null}
        <span className="text-sm text-slate-400">
          Page {query.page} / {pageCount}
        </span>
        {query.page < pageCount ? (
          <Link href={`?page=${query.page + 1}`}>
            <Button variant="secondary">Next</Button>
          </Link>
        ) : null}
      </div>
    </main>
  );
}
