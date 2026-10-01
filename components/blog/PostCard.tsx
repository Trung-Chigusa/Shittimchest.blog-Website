import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CategoryIcon, categoryElement, categoryGradient, elementColor, rarity } from "@/lib/category-icons";
import { fmt, formatDate, getDictionary } from "@/lib/i18n";
import { cn, readingTime } from "@/lib/utils";

export type PostCardData = {
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string | null;
  language: string;
  difficulty?: string | null;
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
        className={cn("h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]", className)}
      />
    );
  }
  const color = elementColor[categoryElement(post.category?.slug)];
  return (
    <div className={cn("relative grid h-full w-full place-items-center overflow-hidden", className)} style={{ background: categoryGradient(post.category?.slug) }}>
      <div className="grid-fade absolute inset-0 opacity-70" />
      <span className="absolute -right-4 bottom-1 select-none font-display text-6xl font-bold uppercase leading-none tracking-tight text-fg/[0.04] sm:text-7xl">
        {post.category?.name ?? "Echo"}
      </span>
      <span className="relative grid h-20 w-20 place-items-center transition duration-700 group-hover:rotate-90">
        <span className="absolute inset-0 rotate-45 border" style={{ borderColor: `${color}99`, boxShadow: `0 0 30px -6px ${color}` }} />
        <span className="absolute inset-3 rotate-45 border border-fg/20" />
      </span>
      <CategoryIcon
        icon={post.category?.icon}
        className={cn("absolute h-8 w-8 drop-shadow-[0_0_12px_currentColor]", iconClassName)}
        style={{ color }}
      />
    </div>
  );
}

export function Stars({ count, className }: { count: number; className?: string }) {
  return (
    <span className={cn("flex gap-0.5", className)} aria-label={`${count}★`}>
      {Array.from({ length: count }, (_, index) => (
        <svg key={index} viewBox="0 0 10 10" className="h-2.5 w-2.5 fill-primary drop-shadow-[0_0_4px_rgb(var(--primary))]" aria-hidden="true">
          <path d="M5 0 6.2 3.8 10 5 6.2 6.2 5 10 3.8 6.2 0 5 3.8 3.8Z" />
        </svg>
      ))}
    </span>
  );
}

export function PostCard({ locale, post, featured = false }: { locale: string; post: PostCardData; featured?: boolean }) {
  const t = getDictionary(locale);
  const href = `/${locale}/blog/${post.slug}`;
  const date = formatDate(post.publishedAt ?? post.createdAt, locale);
  const element = categoryElement(post.category?.slug);
  const color = elementColor[element];

  return (
    <article
      data-tilt
      data-reveal
      className={cn(
        "group card card-hover relative flex h-full flex-col overflow-hidden",
        featured && "lg:grid lg:grid-cols-[1.2fr_1fr]",
      )}
    >
      {/* mouse-following spotlight */}
      <span
        className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgb(var(--primary) / 0.10), transparent 60%)" }}
      />
      <span className="sweep z-[2]" />
      <span className="absolute inset-x-0 top-0 z-[2] h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

      <div className={cn("relative aspect-[16/9] overflow-hidden bg-surface-2", featured && "lg:aspect-auto lg:min-h-[360px]")}>
        <PostCover post={post} iconClassName={featured ? "h-10 w-10" : undefined} />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/10 to-transparent" />
        <span className="absolute left-3 top-3 border border-fg/20 bg-bg/70 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-fg backdrop-blur">
          {post.language}
        </span>
        <Stars count={rarity(post.difficulty)} className="absolute right-3 top-3.5" />
        {post.category ? (
          <span className="absolute bottom-3 left-4 flex items-center gap-2 font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em]" style={{ color }}>
            <span className="h-1.5 w-1.5 rotate-45" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
            {t.fx.elements[element]} · {post.category.name}
          </span>
        ) : null}
      </div>

      <div className={cn("relative flex flex-1 flex-col p-5", featured && "lg:justify-center lg:p-9")}>
        {featured ? <p className="eyebrow mb-4">{t.home.featuredEyebrow}</p> : null}
        <h3
          className={cn(
            "line-clamp-2 font-display text-lg font-semibold leading-snug text-fg transition group-hover:text-primary",
            featured && "lg:text-3xl",
          )}
        >
          <Link href={href} className="after:absolute after:inset-0 after:z-[3]">
            {post.title}
          </Link>
        </h3>
        <p className={cn("mt-3 line-clamp-2 text-sm leading-relaxed text-muted", featured && "lg:line-clamp-3 lg:text-base")}>{post.excerpt}</p>
        {post.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {post.tags.slice(0, 3).map(({ tag }) => (
              <span key={tag.slug} className="font-mono text-[11px] text-subtle">
                #{tag.name}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto pt-5" />
        <div className="flex items-center gap-3 border-t border-line/60 pt-4 text-xs text-subtle">
          <Avatar name={post.author?.displayName ?? "WDT"} src={post.author?.avatarUrl} size="sm" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium text-muted">{post.author?.displayName ?? "Wanna Denia"}</span>
            <time className="mt-0.5 whitespace-nowrap font-mono text-[11px]">{date}</time>
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-3 whitespace-nowrap font-mono text-[11px]">
            <span className="flex items-center gap-1" title={fmt(t.common.minRead, { n: readingTime(post.content) })}>
              <Clock className="h-3.5 w-3.5" />
              {readingTime(post.content)}m
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
