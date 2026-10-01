import { notFound } from "next/navigation";
import { BootIntro } from "@/components/fx/BootIntro";
import { FxLayer } from "@/components/fx/FxLayer";
import { Shortcuts } from "@/components/fx/Shortcuts";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HtmlLang } from "@/components/providers/HtmlLang";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <I18nProvider locale={locale} dictionary={t}>
      <ToastProvider>
        <HtmlLang locale={locale} />
        <BootIntro />
        <FxLayer />
        <a
          href="#main"
          className="sr-only z-[70] bg-primary px-4 py-2 text-sm font-semibold text-primary-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {t.nav.skip}
        </a>
        <div className="relative flex min-h-screen flex-col">
          <Header locale={locale} />
          <div id="main" className="flex-1">
            {children}
          </div>
          <Footer locale={locale} />
        </div>
        <Shortcuts />
      </ToastProvider>
    </I18nProvider>
  );
}
