import Link from "next/link";
import { Suspense } from "react";
import { PenSquare } from "lucide-react";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { getDictionary, type Locale } from "@/lib/i18n";
import { buttonClasses } from "@/components/ui/Button";
import { SoundToggle } from "@/components/fx/SoundToggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NavLinks, type NavItem } from "@/components/layout/NavLinks";
import { UserMenu } from "@/components/layout/UserMenu";

export async function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const user = await getCurrentUserFromCookies();
  const isStaff = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const items: NavItem[] = [
    { href: `/${locale}`, label: t.nav.home, exact: true },
    { href: `/${locale}/blog`, label: t.nav.blog },
    ...(user ? [{ href: `/${locale}/dashboard`, label: t.nav.dashboard }] : []),
    ...(isStaff ? [{ href: `/${locale}/admin`, label: t.nav.admin }] : []),
  ];

  const menuUser = user
    ? { displayName: user.displayName, email: user.email, role: user.role, avatarUrl: user.avatarUrl }
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/70 backdrop-blur-xl">
      <div className="gold-line h-px w-full opacity-70" aria-hidden="true" />
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-10">
          <Link href={`/${locale}`} aria-label="Wanna Denia Team">
            <Logo />
          </Link>
          <NavLinks items={items} />
        </div>
        <div className="flex items-center gap-1">
          <Suspense fallback={<span className="h-9 w-14" />}>
            <LanguageSwitcher />
          </Suspense>
          <SoundToggle />
          <span className="mx-2 hidden h-5 w-px rotate-12 bg-line md:block" aria-hidden="true" />
          {menuUser ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link href={`/${locale}/dashboard?tab=editor`} className={buttonClasses({ size: "sm", variant: "soft" })}>
                <PenSquare />
                {t.nav.write}
              </Link>
              <UserMenu user={menuUser} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href={`/${locale}/login`} className={buttonClasses({ size: "sm", variant: "ghost" })}>
                {t.nav.login}
              </Link>
              <Link href={`/${locale}/register`} className={buttonClasses({ size: "sm" })}>
                {t.nav.register}
              </Link>
            </div>
          )}
          <MobileMenu items={items} user={menuUser} />
        </div>
      </div>
    </header>
  );
}
