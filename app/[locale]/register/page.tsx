import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).auth.register };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (await getCurrentUserFromCookies()) redirect(`/${locale}/dashboard`);
  const t = getDictionary(locale);
  return (
    <AuthShell
      locale={locale}
      title={t.auth.registerTitle}
      subtitle={t.auth.registerSubtitle}
      footer={
        <>
          {t.auth.haveAccount}{" "}
          <Link href={`/${locale}/login`} className="link">
            {t.auth.login}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
