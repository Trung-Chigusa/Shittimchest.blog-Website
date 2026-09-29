import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CategoryIcon, categoryGradient } from "@/lib/category-icons";
import { fmt, formatDate, getDictionary } from "@/lib/i18n";
import { cn, readingTime } from "@/lib/utils";

export type PostCardData = {
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string | null;
  language: string;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
  viewCount?: number;
  content: string;
  category?: { name: string; slug: string; icon?: string | null } | null;
  author?: { displayName: string; avatarUrl?: string | null } | null;
  tags?: { tag: { name: string; slug: string } }[];
};

export function PostCover({ post, className, iconClassName }: { post: PostCardData; className?: string; iconClassName?: string }) {
  if (post.coverImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={post.coverImage}
        alt=""
        loading="lazy"
        className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]", className)}
      />
    );
  }
  return (
    <div className={cn("relative grid h-full w-full place-items-center overflow-hidden", className)} style={{ background: categoryGradient(post.category?.slug) }}>
      <div className="grid-fade absolute inset-0 opacity-40" />
      <CategoryIcon
        icon={post.category?.icon}
        className={cn("relative h-12 w-12 text-white/90 drop-shadow transition duration-500 group-hover:scale-110", iconClassName)}
      />
    </div>
  );
}

export function PostCard({ locale, post, featured = false }: { locale: string; post: PostCardData; featured?: boolean }) {
  const t = getDictionary(locale);
  const href = `/${locale}/blog/${post.slug}`;
  const date = formatDate(post.publishedAt ?? post.createdAt, locale);

  return (
    <article
      className={cn(
        "group card card-hover relative flex h-full flex-col overflow-hidden",
        featured && "lg:grid lg:grid-cols-[1.15fr_1fr]",
      )}
    >
      <div className={cn("relative aspect-[16/9] overflow-hidden bg-surface-2", featured && "lg:aspect-auto lg:min-h-[340px]")}>
        <PostCover post={post} iconClassName={featured ? "h-20 w-20" : undefined} />
        <span className="absolute left-3 top-3 rounded-md bg-black/55 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white backdrop-blur">
          {post.language}
        </span>
      </div>
      <div className={cn("flex flex-1 flex-col p-5", featured && "lg:justify-center lg:p-8")}>
        {post.category ? (
          <Link
            href={`/${locale}/blog?category=${post.category.slug}`}
            className="relative z-10 w-max text-xs font-semibold uppercase tracking-[0.12em] text-primary hover:underline"
          >
            {post.category.name}
          </Link>
        ) : null}
        <h3
          className={cn(
            "mt-2 line-clamp-2 font-display text-lg font-bold leading-snug text-fg transition group-hover:text-primary",
            featured && "lg:text-3xl lg:leading-tight",
          )}
        >
          <Link href={href} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        <p className={cn("mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted", featured && "lg:line-clamp-3 lg:text-base")}>
          {post.excerpt}
        </p>
        {post.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map(({ tag }) => (
              <span key={tag.slug} className="text-xs text-subtle">
                #{tag.name}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex items-center gap-2.5 pt-5 text-xs text-subtle">
          <Avatar name={post.author?.displayName ?? "WDT"} src={post.author?.avatarUrl} size="sm" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-semibold text-muted">{post.author?.displayName ?? "Wanna Denia"}</span>
            <time className="mt-0.5 whitespace-nowrap">{date}</time>
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-3 whitespace-nowrap">
            <span className="flex items-center gap-1" title={fmt(t.common.minRead, { n: readingTime(post.content) })}>
              <Clock className="h-3.5 w-3.5" />
              {readingTime(post.content)}′
            </span>
            {typeof post.viewCount === "number" ? (
              <span className="flex items-center gap-1" title={fmt(t.common.views, { n: post.viewCount })}>
                <Eye className="h-3.5 w-3.5" />
                {post.viewCount}
              </span>
            ) : null}
          </span>
        </div>
      </div>
    </article>
  );
}
