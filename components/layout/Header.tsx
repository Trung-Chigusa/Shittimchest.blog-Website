import Link from "next/link";
import { Suspense } from "react";
import { PenSquare } from "lucide-react";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { getDictionary, type Locale } from "@/lib/i18n";
import { buttonClasses } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NavLinks, type NavItem } from "@/components/layout/NavLinks";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
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
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/75 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/60">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href={`/${locale}`} className="rounded-xl" aria-label="Wanna Denia Team">
            <Logo />
          </Link>
          <NavLinks items={items} />
        </div>
        <div className="flex items-center gap-1">
          <Suspense fallback={<span className="h-9 w-14" />}>
            <LanguageSwitcher />
          </Suspense>
          <ThemeToggle />
          <span className="mx-1.5 hidden h-6 w-px bg-line md:block" aria-hidden="true" />
          {menuUser ? (
            <div className="hidden items-center gap-2 md:flex">
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
