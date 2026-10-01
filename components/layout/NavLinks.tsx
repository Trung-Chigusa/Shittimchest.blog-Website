"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; exact?: boolean };

export function isActivePath(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      {items.map((item, index) => {
        const active = isActivePath(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-2 px-3 py-2 font-display text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-muted transition hover:text-fg",
              active && "text-primary hover:text-primary",
            )}
          >
            <span className={cn("font-mono text-[0.6rem] text-subtle transition group-hover:text-primary", active && "text-primary")}>
              {String(index + 1).padStart(2, "0")}
            </span>
            {item.label}
            <span
              className={cn(
                "absolute inset-x-3 -bottom-[13px] h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100",
                active && "scale-x-100 shadow-[0_0_10px_rgb(var(--primary))]",
              )}
            />
            {active ? <span className="absolute -bottom-[16px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-primary" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
