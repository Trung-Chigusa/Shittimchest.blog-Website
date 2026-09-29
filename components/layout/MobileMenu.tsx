"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useLogout } from "@/components/auth/useLogout";
import { Logo } from "@/components/layout/Logo";
import { isActivePath, type NavItem } from "@/components/layout/NavLinks";
import type { MenuUser } from "@/components/layout/UserMenu";
import { useI18n } from "@/components/providers/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function MobileMenu({ items, user }: { items: NavItem[]; user: MenuUser | null }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const { logout, pending } = useLogout();
  const [open, setOpen] = useState(false);

  // Close whenever navigation happens.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-lg text-fg transition hover:bg-surface-2 md:hidden"
        aria-label={t.nav.menu}
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
              <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
              <div className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] animate-slide-in-right flex-col border-l border-line bg-surface shadow-lift">
                <div className="flex h-16 items-center justify-between border-b border-line px-4">
                  <Logo />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                    aria-label={t.common.close}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {user ? (
                  <div className="flex items-center gap-3 border-b border-line p-4">
                    <Avatar name={user.displayName} src={user.avatarUrl} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-fg">{user.displayName}</p>
                      <p className="truncate text-xs text-subtle">{user.email}</p>
                    </div>
                  </div>
                ) : null}
                <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Mobile">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block rounded-xl px-3.5 py-3 text-[0.95rem] font-medium text-muted transition hover:bg-surface-2 hover:text-fg",
                        isActivePath(pathname, item) && "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="space-y-2 border-t border-line p-4">
                  {user ? (
                    <>
                      <Link href={`/${locale}/dashboard?tab=editor`} className={buttonClasses({ className: "w-full" })}>
                        {t.nav.write}
                      </Link>
                      <button
                        type="button"
                        onClick={logout}
                        disabled={pending}
                        className={buttonClasses({ variant: "danger", className: "w-full" })}
                      >
                        <LogOut />
                        {t.nav.logout}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href={`/${locale}/register`} className={buttonClasses({ className: "w-full" })}>
                        {t.nav.register}
                      </Link>
                      <Link href={`/${locale}/login`} className={buttonClasses({ variant: "secondary", className: "w-full" })}>
                        {t.nav.login}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
