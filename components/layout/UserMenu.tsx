"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Bookmark, ChevronDown, FileText, LayoutDashboard, LogOut, PenSquare, ShieldCheck } from "lucide-react";
import { useLogout } from "@/components/auth/useLogout";
import { useI18n } from "@/components/providers/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { useDismiss } from "@/lib/use-dismiss";

export type MenuUser = { displayName: string; email: string; role: string; avatarUrl?: string | null };

export function UserMenu({ user }: { user: MenuUser }) {
  const { locale, t } = useI18n();
  const { logout, pending } = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const isStaff = user.role === "ADMIN" || user.role === "MODERATOR";

  const items = [
    { href: `/${locale}/dashboard`, label: t.nav.dashboard, icon: LayoutDashboard },
    { href: `/${locale}/dashboard?tab=posts`, label: t.nav.myPosts, icon: FileText },
    { href: `/${locale}/dashboard?tab=editor`, label: t.nav.write, icon: PenSquare },
    { href: `/${locale}/dashboard?tab=bookmarks`, label: t.nav.bookmarks, icon: Bookmark },
    ...(isStaff ? [{ href: `/${locale}/admin`, label: t.nav.admin, icon: ShieldCheck }] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 p-0.5 pr-1.5 transition hover:bg-fg/[0.05]"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={user.displayName}
      >
        <Avatar name={user.displayName} src={user.avatarUrl} />
        <ChevronDown className="h-3.5 w-3.5 text-subtle" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-12 z-50 w-64 animate-fade-in rounded-2xl border border-line bg-surface p-1.5 shadow-lift">
          <div className="flex items-center gap-3 border-b border-line px-2.5 pb-3 pt-2">
            <Avatar name={user.displayName} src={user.avatarUrl} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{user.displayName}</p>
              <p className="truncate text-xs text-subtle">{user.email}</p>
            </div>
          </div>
          <div className="py-1.5">
            {items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={close}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-fg"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            disabled={pending}
            className="flex w-full items-center gap-2.5 rounded-lg border-t border-line px-2.5 py-2.5 text-sm text-danger transition hover:bg-danger/10 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {t.nav.logout}
          </button>
        </div>
      ) : null}
    </div>
  );
}
