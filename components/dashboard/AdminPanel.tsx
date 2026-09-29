"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Inbox, Search, Trash2, XCircle } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { apiRequest, errorMessage } from "@/lib/client-api";
import { fmt, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type AdminPost = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  language: string;
  updatedAt: string;
  author: { displayName: string; email: string };
  category: { name: string };
};

const filters = ["ALL", "PENDING", "PUBLISHED", "DRAFT", "REJECTED"] as const;

export function AdminPanel({ posts }: { posts: AdminPost[] }) {
  const { locale, t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [dialog, ask] = useConfirm();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof filters)[number]>(posts.some((post) => post.status === "PENDING") ? "PENDING" : "ALL");
  const [busy, setBusy] = useState<string | null>(null);

  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: posts.length };
    for (const post of posts) result[post.status] = (result[post.status] ?? 0) + 1;
    return result;
  }, [posts]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter(
      (post) =>
        (status === "ALL" || post.status === status) &&
        (!needle ||
          [post.title, post.slug, post.author.displayName, post.author.email, post.category.name].some((value) =>
            value.toLowerCase().includes(needle),
          )),
    );
  }, [posts, query, status]);

  async function review(post: AdminPost, action: "APPROVE" | "REJECT") {
    let reason = "";
    if (action === "REJECT") {
      const answer = await ask({
        title: `${t.admin.reject}: ${post.title}`,
        inputLabel: t.admin.rejectPrompt,
        confirmLabel: t.admin.reject,
        cancelLabel: t.common.cancel,
      });
      if (answer === null) return;
      reason = answer;
    }
    setBusy(post.id);
    try {
      await apiRequest(`/api/posts/${encodeURIComponent(post.slug)}/review`, { json: { action, reason } });
      toast(action === "APPROVE" ? t.admin.approved : t.admin.rejected, "success");
      router.refresh();
    } catch (error) {
      toast(errorMessage(error, t), "error");
    } finally {
      setBusy(null);
    }
  }

  async function remove(post: AdminPost) {
    const answer = await ask({
      title: `${t.admin.remove}: ${post.title}`,
      body: fmt(t.dashboard.deleteConfirm, { title: post.title }),
      confirmLabel: t.admin.remove,
      cancelLabel: t.common.cancel,
    });
    if (answer === null) return;
    setBusy(post.id);
    try {
      await apiRequest(`/api/posts/${encodeURIComponent(post.slug)}`, { method: "DELETE" });
      toast(t.admin.removed, "success");
      router.refresh();
    } catch (error) {
      toast(errorMessage(error, t), "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card overflow-hidden">
      {dialog}
      <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto scrollbar-none">
          {filters.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg",
                status === key && "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary",
              )}
            >
              {key === "ALL" ? t.admin.allStatuses : t.status[key]}
              <span className="rounded-md bg-surface-2 px-1.5 text-xs tabular-nums">{counts[key] ?? 0}</span>
            </button>
          ))}
        </div>
        <label className="relative block lg:w-80">
          <span className="sr-only">{t.admin.searchPlaceholder}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.admin.searchPlaceholder} className="h-10 pl-10" />
        </label>
      </div>

      {filtered.length ? (
        <ul className="divide-y divide-line">
          {filtered.map((post) => (
            <li key={post.id} className={cn("flex flex-col gap-4 p-4 transition sm:px-5 lg:flex-row lg:items-center", busy === post.id && "opacity-50")}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
                  <StatusBadge status={post.status} label={t.status[post.status]} />
                  <span>{post.category.name}</span>
                  <span>·</span>
                  <span className="uppercase">{post.language}</span>
                  <span>·</span>
                  <span>{formatDate(post.updatedAt, locale)}</span>
                </div>
                <p className="mt-1.5 truncate font-display font-semibold text-fg">{post.title}</p>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                  <Avatar name={post.author.displayName} size="xs" />
                  <span className="font-medium">{post.author.displayName}</span>
                  <span className="truncate text-subtle">{post.author.email}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {post.status === "PENDING" ? (
                  <>
                    <Button size="sm" onClick={() => review(post, "APPROVE")} disabled={busy === post.id} className="bg-success text-white hover:bg-success/90">
                      <CheckCircle2 />
                      {t.admin.approve}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => review(post, "REJECT")} disabled={busy === post.id}>
                      <XCircle />
                      {t.admin.reject}
                    </Button>
                  </>
                ) : null}
                <Link
                  href={`/${locale}/blog/${post.slug}`}
                  target="_blank"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-muted transition hover:bg-surface-2 hover:text-fg"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t.admin.open}
                </Link>
                <Button size="sm" variant="danger" onClick={() => remove(post)} disabled={busy === post.id}>
                  <Trash2 />
                  {t.admin.remove}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Inbox} title={t.admin.none} className="m-4 border-0" />
      )}
    </section>
  );
}
