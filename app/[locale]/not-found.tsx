import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Compass } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n";

export default async function LocaleNotFound() {
  const locale = (await headers()).get("x-locale") ?? "vi";
  const t = getDictionary(locale);
  return (
    <main className="container-page grid min-h-[65vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <p className="text-gradient font-display text-8xl font-extrabold">404</p>
        <h1 className="mt-4 text-2xl font-bold">{t.notFound.title}</h1>
        <p className="mt-2 text-muted">{t.notFound.body}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={`/${locale}`} className={buttonClasses()}>
            <ArrowLeft />
            {t.common.backHome}
          </Link>
          <Link href={`/${locale}/blog`} className={buttonClasses({ variant: "secondary" })}>
            <Compass />
            {t.nav.blog}
          </Link>
        </div>
      </div>
    </main>
  );
}
