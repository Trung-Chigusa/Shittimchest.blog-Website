import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { GlowCard } from "@/components/animations/GlowCard";
import { formatDate, readingTime } from "@/lib/utils";

type PostCardProps = {
  locale: string;
  post: {
    title: string;
    slug: string;
    excerpt: string;
    coverImage?: string | null;
    language: string;
    publishedAt?: Date | string | null;
    createdAt?: Date | string | null;
    viewCount?: number;
    content: string;
    category?: { name: string; slug: string } | null;
    author?: { displayName: string } | null;
    tags?: { tag: { name: string; slug: string } }[];
  };
};

export function PostCard({ locale, post }: PostCardProps) {
  return (
    <GlowCard className="grid h-full grid-rows-[auto_1fr_auto] overflow-hidden p-0">
      <Link href={`/${locale}/blog/${post.slug}`} className="block">
        <div className="aspect-[16/9] overflow-hidden border-b border-white/10 bg-slate-900">
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImage} alt="" className="h-full w-full object-cover transition duration-300 hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center bg-grid bg-[length:28px_28px] text-cyan-100">WDT</div>
          )}
        </div>
      </Link>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {post.category ? <Badge>{post.category.name}</Badge> : null}
          <Badge className="border-violet-200/25 bg-violet-200/10 text-violet-100">{post.language.toUpperCase()}</Badge>
        </div>
        <Link href={`/${locale}/blog/${post.slug}`}>
          <h3 className="line-clamp-2 text-xl font-semibold text-white hover:text-cyan-100">{post.title}</h3>
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{post.excerpt}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4 text-xs text-slate-400">
        <span>{post.author?.displayName ?? "Wanna Denia"}</span>
        <span>
          {readingTime(post.content)} min · {formatDate(post.publishedAt ?? post.createdAt)}
        </span>
      </div>
    </GlowCard>
  );
}
