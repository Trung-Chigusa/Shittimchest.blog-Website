import Link from "next/link";
import { AnimeText } from "@/components/animations/AnimeText";
import { LoginForm } from "@/components/auth/LoginForm";
import { VideoBackdrop } from "@/components/layout/VideoBackdrop";
import { getDictionary } from "@/lib/i18n";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  return (
    <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
      <VideoBackdrop compact />
      <div className="section-shell grid min-h-[calc(100vh-4rem)] place-items-center py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/16 bg-white/[0.075] p-6 shadow-glow backdrop-blur-2xl sm:p-8">
          <div className="mb-7 text-center">
            <AnimeText as="h1" text="Wanna Denia Team" className="text-3xl font-black text-white" />
            <p className="mt-3 text-sm text-slate-300">Access your member dashboard and publish security notes.</p>
          </div>
          <LoginForm locale={locale} labels={dictionary.auth} />
          <p className="mt-5 text-center text-sm text-slate-400">
            <Link className="text-cyan-200 hover:text-white" href={`/${locale}/register`}>
              Create a verified account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
