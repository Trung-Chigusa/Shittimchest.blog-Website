import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, FlaskConical, Flag, HeartHandshake, Radar } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { Emblem } from "@/components/fx/Emblem";
import { Typewriter } from "@/components/fx/Typewriter";
import { VideoBackdrop } from "@/components/layout/VideoBackdrop";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { CategoryIcon, categoryElement, elementColor } from "@/lib/category-icons";
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
  const menuTargets = [
    `/${locale}/blog`,
    `/${locale}/blog?category=ctf-writeups`,
    user ? `/${locale}/dashboard?tab=editor` : `/${locale}/login?next=${encodeURIComponent(`/${locale}/dashboard?tab=editor`)}`,
    user ? `/${locale}/dashboard` : `/${locale}/register`,
  ];

  return (
    <main>
      {/* ───────── Title screen ───────── */}
      <section className="relative isolate overflow-hidden border-b border-line/50">
        <VideoBackdrop />
        <Emblem className="pointer-events-none absolute -right-40 top-1/2 -z-10 hidden w-[44rem] -translate-y-1/2 opacity-80 lg:block" />
        <span
          className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 font-display text-[0.65rem] uppercase tracking-[0.6em] text-subtle [writing-mode:vertical-rl] xl:block"
          aria-hidden="true"
        >
          Resonance · Archive · 共鳴
        </span>

        <div className="container-page relative flex min-h-[calc(100svh-4.1rem)] flex-col justify-center py-10">
          <div className="max-w-2xl">
            <p className="eyebrow animate-fade-up">{t.hero.eyebrow}</p>
            <h1 className="mt-6 animate-fade-up font-display text-5xl font-bold uppercase leading-[1.05] tracking-[0.06em] [animation-delay:80ms] sm:text-7xl">
              <span className="text-gradient">Wanna</span>
              <br />
              <span className="text-fg">Denia</span>
              <span className="ml-3 align-top font-mono text-sm font-normal tracking-normal text-primary sm:text-base">{"// team"}</span>
            </h1>
            <p className="mt-4 animate-fade-up font-display text-lg uppercase tracking-[0.12em] text-fg/90 [animation-delay:160ms] sm:text-xl">
              {t.hero.titleA} <span className="text-primary">{t.hero.titleB}</span>
            </p>
            <p className="mt-3 max-w-xl animate-fade-up text-base leading-relaxed text-muted [animation-delay:220ms]">{t.hero.subtitle}</p>
            <p className="mt-4 animate-fade-up font-mono text-sm text-subtle [animation-delay:260ms]">
              <span className="text-primary">&gt;</span> scan --topic{" "}
              <Typewriter words={categories.map((category) => category.name)} className="text-fg" />
            </p>
          </div>

          {/* Game-style main menu */}
          <nav className="mt-7 max-w-md animate-fade-up [animation-delay:320ms]" aria-label={t.fx.menuHint}>
            <p className="mb-3 font-display text-[0.65rem] uppercase tracking-[0.4em] text-subtle">{t.fx.menuHint}</p>
            <ul className="space-y-1">
              {t.hero.menu.map((item, index) => (
                <li key={item.title}>
                  <Link
                    href={menuTargets[index]}
                    className="group relative flex items-center gap-4 overflow-hidden border-l border-line px-4 py-2 transition-colors duration-300 hover:border-primary hover:bg-gradient-to-r hover:from-primary/15 hover:to-transparent"
                  >
                    <span className="font-mono text-xs text-subtle transition group-hover:text-primary">{String(index + 1).padStart(2, "0")}</span>
                    <span className="flex-1 transition-transform duration-300 group-hover:translate-x-1.5">
                      <span className="block font-display text-base font-semibold uppercase tracking-[0.14em] text-fg group-hover:text-primary">
                        {item.title}
                      </span>
                      <span className="block text-xs text-subtle">{item.sub}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 -translate-x-2 text-primary opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* HUD stat strip */}
          <dl className="mt-7 grid max-w-xl animate-fade-up grid-cols-3 border border-line/70 bg-surface/50 backdrop-blur [animation-delay:400ms]">
            {stats.map((stat, index) => (
              <div key={stat.label} className={index ? "border-l border-line/70 px-3 py-4 sm:px-5" : "px-3 py-4 sm:px-5"}>
                <dt className="truncate font-display text-[0.6rem] uppercase tracking-[0.15em] text-subtle sm:tracking-[0.3em]">{stat.label}</dt>
                <dd className="mt-1 font-display text-3xl font-bold tabular-nums text-fg">{formatNumber(stat.value, locale)}</dd>
              </div>
            ))}
          </dl>

          <div className="absolute bottom-6 right-8 hidden flex-col items-center gap-2 text-subtle lg:flex" aria-hidden="true">
            <span className="font-display text-[0.6rem] uppercase tracking-[0.4em]">Scroll</span>
            <span className="h-10 w-px animate-pulse bg-gradient-to-b from-primary to-transparent" />
          </div>
        </div>
      </section>

      {/* ───────── Latest ───────── */}
      <section className="container-page pt-24">
        <SectionHeading index={1} eyebrow={t.home.featuredEyebrow} title={t.home.featuredTitle}>
          <Link href={`/${locale}/blog`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
            {t.home.viewAll}
            <ArrowRight />
          </Link>
        </SectionHeading>
        {featured ? (
          <div className="mt-10 space-y-6">
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
          <EmptyState className="mt-10" icon={BookOpen} title={t.home.emptyPosts} />
        )}
      </section>

      {/* ───────── Topics as elements ───────── */}
      <section className="container-page pt-28">
        <SectionHeading index={2} eyebrow={t.home.topicsEyebrow} title={t.home.topicsTitle} body={t.home.topicsSubtitle} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((category) => {
            const element = categoryElement(category.slug);
            const color = elementColor[element];
            return (
              <Link
                key={category.slug}
                href={`/${locale}/blog?category=${category.slug}`}
                data-tilt
                data-reveal
                className="group card card-hover relative flex min-h-48 flex-col overflow-hidden p-5"
              >
                <span className="sweep" />
                <span
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                  style={{ background: color }}
                />
                <span className="relative grid h-11 w-11 place-items-center">
                  <span className="absolute inset-0 rotate-45 border transition duration-500 group-hover:rotate-[135deg]" style={{ borderColor: `${color}aa` }} />
                  <CategoryIcon icon={category.icon} className="relative h-5 w-5" style={{ color }} />
                </span>
                <p className="mt-5 font-display text-[0.6rem] uppercase tracking-[0.3em]" style={{ color }}>
                  {t.fx.elements[element]}
                </p>
                <p className="mt-1 font-display text-base font-semibold text-fg">{category.name}</p>
                {category.description ? <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{category.description}</p> : null}
                <p className="mt-auto flex items-center justify-between pt-4 font-mono text-[11px] text-subtle">
                  {fmt(t.home.postsCount, { n: category._count.posts })}
                  <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1 group-hover:text-primary" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───────── About ───────── */}
      <section className="container-page pt-28">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div data-reveal>
            <p className="eyebrow">{t.home.aboutEyebrow}</p>
            <h2 className="hud-title mt-4 text-3xl sm:text-4xl">{t.home.aboutTitle}</h2>
            <p className="mt-6 leading-relaxed text-muted">{t.home.aboutBody}</p>
          </div>
          <div className="relative grid gap-4 sm:grid-cols-2">
            {t.home.pillars.map((pillar, index) => {
              const Icon = pillarIcons[index % pillarIcons.length];
              return (
                <div
                  key={pillar.title}
                  data-reveal
                  className="group card card-hover overflow-hidden p-6"
                >
                  <span className="sweep" />
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="font-mono text-[10px] text-subtle">NODE-{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <p className="mt-5 font-display text-base font-semibold uppercase tracking-[0.1em] text-fg">{pillar.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── Call to action ───────── */}
      <section className="container-page pt-28">
        <div data-reveal className="card relative isolate overflow-hidden px-6 py-16 text-center sm:px-12">
          <div className="aurora absolute inset-0 -z-10" />
          <div className="grid-fade absolute inset-0 -z-10 opacity-60" />
          <Emblem className="absolute left-1/2 top-1/2 -z-10 w-[36rem] -translate-x-1/2 -translate-y-1/2 opacity-25" />
          <p className="eyebrow justify-center">Resonance link</p>
          <h2 className="hud-title mx-auto mt-5 max-w-2xl text-3xl sm:text-4xl">{t.home.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">{t.home.ctaBody}</p>
          <Link href={user ? `/${locale}/dashboard?tab=editor` : `/${locale}/register`} className={buttonClasses({ size: "lg", className: "mt-9" })}>
            {user ? t.hero.writeArticle : t.home.ctaButton}
            <ArrowRight />
          </Link>
        </div>
      </section>
    </main>
  );
}
