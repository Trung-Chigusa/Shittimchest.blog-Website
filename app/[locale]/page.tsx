import Link from "next/link";
import { ArrowRight, BookOpen, FlaskConical, Flag, HeartHandshake, PenSquare, Radar, Sparkles } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { VideoBackdrop } from "@/components/layout/VideoBackdrop";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { CategoryIcon } from "@/lib/category-icons";
import { prisma } from "@/lib/db";
import { fmt, formatNumber, getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const pillarIcons = [Flag, FlaskConical, Radar, HeartHandshake];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDictionary(locale);

  const [latestPosts, postCount, memberCount, categories, user] = await Promise.all([
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      include: {
        author: { select: { displayName: true, avatarUrl: true } },
        category: { select: { name: true, slug: true, icon: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        name: true,
        slug: true,
        icon: true,
        description: true,
        _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
      },
    }),
    getCurrentUserFromCookies(),
  ]);

  const [featured, ...rest] = latestPosts;
  const stats = [
    { label: t.hero.statPosts, value: postCount },
    { label: t.hero.statMembers, value: memberCount },
    { label: t.hero.statTopics, value: categories.length },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-line/60">
        <VideoBackdrop />
        <div className="container-page grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t.hero.eyebrow}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.18] sm:text-5xl lg:text-6xl">
              {t.hero.titleA}
              <br />
              <span className="text-gradient">{t.hero.titleB}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{t.hero.subtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={`/${locale}/blog`} className={buttonClasses({ size: "lg" })}>
                <BookOpen />
                {t.hero.readBlog}
              </Link>
              <Link
                href={user ? `/${locale}/dashboard?tab=editor` : `/${locale}/register`}
                className={buttonClasses({ size: "lg", variant: "secondary" })}
              >
                {user ? <PenSquare /> : null}
                {user ? t.hero.writeArticle : t.hero.joinTeam}
                <ArrowRight />
              </Link>
            </div>
            <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs font-medium uppercase tracking-[0.14em] text-subtle">{stat.label}</dt>
                  <dd className="mt-1 font-display text-3xl font-bold text-fg">{formatNumber(stat.value, locale)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <HeroTerminal />
        </div>
      </section>

      {/* Latest */}
      <section className="container-page pt-20">
        <SectionHeading eyebrow={t.home.featuredEyebrow} title={t.home.featuredTitle}>
          <Link href={`/${locale}/blog`} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            {t.home.viewAll}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </SectionHeading>
        {featured ? (
          <div className="mt-8 space-y-6">
            <PostCard locale={locale} post={featured} featured />
            {rest.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <PostCard key={post.slug} locale={locale} post={post} />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState className="mt-8" icon={BookOpen} title={t.home.emptyPosts} />
        )}
      </section>

      {/* Topics */}
      <section className="container-page pt-24">
        <SectionHeading eyebrow={t.home.topicsEyebrow} title={t.home.topicsTitle} body={t.home.topicsSubtitle} />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((category) => {
            return (
              <Link
                key={category.slug}
                href={`/${locale}/blog?category=${category.slug}`}
                className="group card card-hover flex flex-col p-5"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-primary-fg">
                  <CategoryIcon icon={category.icon} className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display font-semibold text-fg">{category.name}</p>
                {category.description ? (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{category.description}</p>
                ) : null}
                <p className="mt-auto pt-4 text-xs font-semibold text-subtle">
                  {fmt(t.home.postsCount, { n: category._count.posts })}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* About */}
      <section className="container-page pt-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">{t.home.aboutEyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{t.home.aboutTitle}</h2>
            <p className="mt-5 leading-relaxed text-muted">{t.home.aboutBody}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {t.home.pillars.map((pillar, index) => {
              const Icon = pillarIcons[index % pillarIcons.length];
              return (
                <div key={pillar.title} className="card p-5">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 font-display font-semibold text-fg">{pillar.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{pillar.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pt-24">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent px-6 py-14 text-center text-white shadow-lift sm:px-12">
          <div className="grid-fade absolute inset-0 -z-10 opacity-30" />
          <div className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full border-[18px] border-white/15" />
          <div className="absolute -bottom-32 -left-16 -z-10 h-72 w-72 rounded-full bg-halo/30 blur-3xl" />
          <h2 className="mx-auto max-w-2xl text-3xl font-bold text-white sm:text-4xl">{t.home.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">{t.home.ctaBody}</p>
          <Link
            href={user ? `/${locale}/dashboard?tab=editor` : `/${locale}/register`}
            className={buttonClasses({ size: "lg", className: "mt-8 bg-white text-primary hover:bg-white/90 hover:shadow-none" })}
          >
            {user ? t.hero.writeArticle : t.home.ctaButton}
            <ArrowRight />
          </Link>
        </div>
      </section>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold">{title}</h2>
        {body ? <p className="mt-3 text-muted">{body}</p> : null}
      </div>
      {children}
    </div>
  );
}

/** Decorative "tablet" showing a terminal session — purely visual. */
function HeroTerminal() {
  const lines: [string, string][] = [
    ["$", "nmap -sV shittimchest.blog"],
    ["", "22/tcp   open  ssh     OpenSSH 9.6"],
    ["", "443/tcp  open  https   nginx"],
    ["$", "cat notes/ctf/web-101.md | head -3"],
    ["", "# Read the request before you attack"],
    ["", "- Inspect cookies, headers, redirects"],
    ["$", "echo \"learn → build → share\""],
  ];
  return (
    <div className="relative hidden animate-fade-up [animation-delay:150ms] lg:block" aria-hidden="true">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/30 via-accent/20 to-halo/25 blur-2xl" />
      <div className="absolute -right-4 -top-9 h-12 w-40 -rotate-6 rounded-[50%] border-[3px] border-halo/60 shadow-[0_0_24px_rgb(var(--halo)/0.45)]" />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020]/95 shadow-lift">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-xs text-slate-400">shittim@chest: ~</span>
        </div>
        <div className="space-y-1.5 p-5 font-mono text-[13px] leading-relaxed">
          {lines.map(([prompt, text], index) => (
            <p key={index} className={prompt ? "text-slate-100" : "text-slate-400"}>
              {prompt ? <span className="mr-2 text-[#56a4ff]">{prompt}</span> : null}
              {text}
            </p>
          ))}
          <p className="text-slate-100">
            <span className="mr-2 text-[#56a4ff]">$</span>
            <span className="inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-[#56a4ff]" />
          </p>
        </div>
      </div>
    </div>
  );
}
