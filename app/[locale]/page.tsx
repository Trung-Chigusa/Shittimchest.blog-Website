import Link from "next/link";
import { ArrowRight, Binary, BookOpen, FlaskConical, Network, RadioTower, ShieldCheck, Terminal, Users, type LucideIcon } from "lucide-react";
import { AnimeText } from "@/components/animations/AnimeText";
import { GlowCard } from "@/components/animations/GlowCard";
import { PostCard } from "@/components/blog/PostCard";
import { VideoBackdrop } from "@/components/layout/VideoBackdrop";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const knowledge: Array<[string, LucideIcon]> = [
  ["CTF Writeups", Terminal],
  ["Web Security", ShieldCheck],
  ["Network Security", Network],
  ["System Administration", Binary],
  ["Blue Team / SOC", RadioTower],
  ["Red Team Basics", Terminal],
  ["Forensics", BookOpen],
  ["Malware Analysis Notes", FlaskConical],
  ["Linux / Windows", Binary],
  ["Tools & Labs", FlaskConical],
];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  const latestPosts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    include: {
      author: { select: { displayName: true } },
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return (
    <main>
      <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
        <VideoBackdrop />
        <div className="section-shell flex min-h-[calc(100vh-4rem)] flex-col justify-center pb-20 pt-16">
          <p className="cyber-label">CTF · Cybersecurity · Network · Systems</p>
          <AnimeText
            as="h1"
            text="Wanna Denia Team"
            className="mt-5 max-w-5xl justify-start text-left text-5xl font-black tracking-normal text-white sm:text-7xl lg:text-8xl"
          />
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">{dictionary.hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${locale}/blog`}>
              <Button>
                <BookOpen className="h-4 w-4" />
                {dictionary.hero.readBlog}
              </Button>
            </Link>
            <Link href={`/${locale}/register`}>
              <Button variant="secondary">
                <Users className="h-4 w-4" />
                {dictionary.hero.joinTeam}
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard`}>
              <Button variant="secondary">
                <ArrowRight className="h-4 w-4" />
                {dictionary.hero.writeArticle}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-shell py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="cyber-label">About</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Built for practical learners</h2>
            <p className="mt-5 leading-8 text-slate-300">
              Wanna Denia Team is a community for CTF players, cybersecurity learners, network enthusiasts, and system
              builders. We publish writeups, labs, learning notes, tool guides, and practical security knowledge to support
              beginners and practitioners.
            </p>
          </div>
          <GlowCard className="grid gap-4 sm:grid-cols-2">
            {["Red team basics", "Blue team/SOC", "SIEM and forensics", "Web security labs"].map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-slate-950/40 p-4">
                <p className="font-semibold text-white">{item}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Warm notes, practical labs, careful sharing.</p>
              </div>
            ))}
          </GlowCard>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950/45 py-16">
        <div className="section-shell">
          <p className="cyber-label">Knowledge Categories</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Choose a path, build a lab, write it down</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {knowledge.map(([name, Icon]) => (
              <GlowCard key={name} className="min-h-32">
                <Icon className="h-6 w-6 text-cyan-200" />
                <p className="mt-4 font-semibold text-white">{name}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="cyber-label">Latest Posts</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Fresh notes from the team</h2>
          </div>
          <Link className="text-sm font-semibold text-cyan-200 hover:text-white" href={`/${locale}/blog`}>
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {latestPosts.map((post) => (
            <PostCard key={post.id} locale={locale} post={post} />
          ))}
        </div>
      </section>

      <section className="section-shell pb-20">
        <div className="glass-panel grid gap-5 p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="cyber-label">Community Support</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Share knowledge, support beginners, grow together.</h2>
          </div>
          <Link href={`/${locale}/register`}>
            <Button>
              Join Team
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
