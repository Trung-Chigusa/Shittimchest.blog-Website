"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

type Option = { slug: string; name: string };

export function PostFilters({ categories, tags }: { categories: Option[]; tags: Option[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [pending, startTransition] = useTransition();

  const activeCategory = params.get("category") ?? "";
  const hasFilters = ["search", "category", "tag", "language", "sort"].some((key) => params.get(key));

  function hrefWith(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page"); // any filter change starts from page 1
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function update(updates: Record<string, string | null>) {
    startTransition(() => router.push(hrefWith(updates), { scroll: false }));
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <form
          role="search"
          className="relative flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            update({ search: search.trim() || null });
          }}
        >
          <label htmlFor="blog-search" className="sr-only">
            {t.blog.search}
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input
            id="blog-search"
            type="search"
            value={search}
            autoFocus={params.get("focus") === "search"}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.blog.searchPlaceholder}
            maxLength={80}
            className="h-11 w-full border border-transparent bg-bg/60 pl-10 pr-16 text-sm text-fg outline-none transition placeholder:text-subtle focus:border-primary/60 focus:shadow-[0_0_20px_-6px_rgb(var(--primary)/0.6)]"
          />
          {!search && !pending ? (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 border border-line px-1.5 font-mono text-[10px] text-subtle sm:block">/</kbd>
          ) : null}
          {pending ? (
            <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
          ) : search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                update({ search: null });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-subtle hover:bg-surface-2 hover:text-fg"
              aria-label={t.blog.clearFilters}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </form>
        <div className="grid grid-cols-3 gap-2 sm:w-[32rem]">
          <Select aria-label={t.blog.tag} value={params.get("tag") ?? ""} onChange={(event) => update({ tag: event.target.value || null })}>
            <option value="">{t.blog.allTags}</option>
            {tags.map((tag) => (
              <option key={tag.slug} value={tag.slug}>
                #{tag.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label={t.blog.language}
            value={params.get("language") ?? ""}
            onChange={(event) => update({ language: event.target.value || null })}
          >
            <option value="">{t.blog.allLanguages}</option>
            <option value="vi">{t.languages.vi}</option>
            <option value="en">{t.languages.en}</option>
            <option value="ja">{t.languages.ja}</option>
          </Select>
          <Select aria-label={t.blog.sort} value={params.get("sort") ?? "latest"} onChange={(event) => update({ sort: event.target.value === "latest" ? null : event.target.value })}>
            <option value="latest">{t.blog.latest}</option>
            <option value="popular">{t.blog.popular}</option>
          </Select>
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip href={hrefWith({ category: null })} active={!activeCategory}>
          {t.blog.allCategories}
        </Chip>
        {categories.map((category) => (
          <Chip key={category.slug} href={hrefWith({ category: category.slug })} active={activeCategory === category.slug}>
            {category.name}
          </Chip>
        ))}
        {hasFilters ? (
          <Link
            href={pathname}
            scroll={false}
            className="inline-flex shrink-0 items-center gap-1 px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-danger transition hover:bg-danger/10"
          >
            <X className="h-3.5 w-3.5" />
            {t.blog.clearFilters}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "cut-sm shrink-0 border px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.12em] transition",
        active
          ? "border-primary bg-primary text-primary-fg shadow-[0_0_18px_-4px_rgb(var(--primary)/0.7)]"
          : "border-line bg-surface/70 text-muted hover:border-primary/60 hover:text-primary",
      )}
    >
      {children}
    </Link>
  );
}
