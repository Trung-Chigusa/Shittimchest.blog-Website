"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Heart, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { StatusBadge } from "@/components/ui/Badge";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { apiRequest, errorMessage } from "@/lib/client-api";
import { fmt, formatDate } from "@/lib/format";

export type DashboardPost = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  language: string;
  updatedAt: string;
  viewCount: number;
  rejectionReason: string | null;
  category: string;
  likes: number;
  comments: number;
};

export function MyPostsList({ posts, compact = false }: { posts: DashboardPost[]; compact?: boolean }) {
  const { locale, t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [dialog, ask] = useConfirm();

  async function remove(post: DashboardPost) {
    const answer = await ask({
      title: t.common.delete,
      body: fmt(t.dashboard.deleteConfirm, { title: post.title }),
      confirmLabel: t.common.delete,
      cancelLabel: t.common.cancel,
    });
    if (answer === null) return;
    try {
      await apiRequest(`/api/posts/${encodeURIComponent(post.slug)}`, { method: "DELETE" });
      toast(t.dashboard.deleted, "success");
      router.refresh();
    } catch (error) {
      toast(errorMessage(error, t), "error");
    }
  }

  return (
    <>
      {dialog}
      <ul className="divide-y divide-line">
        {posts.map((post) => (
          <li key={post.id} className="group flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={post.status} label={t.status[post.status]} />
                <span className="text-xs text-subtle">
                  {post.category} · {post.language.toUpperCase()} · {t.dashboard.updated} {formatDate(post.updatedAt, locale)}
                </span>
              </div>
              <Link
                href={`/${locale}/blog/${post.slug}`}
                className="mt-1.5 block truncate font-display font-semibold text-fg transition hover:text-primary"
              >
                {post.title}
              </Link>
              {post.status === "REJECTED" && post.rejectionReason ? (
                <p className="mt-1.5 rounded-lg bg-danger/10 px-2.5 py-1.5 text-xs text-danger">
                  <span className="font-semibold">{t.dashboard.rejectedReason}:</span> {post.rejectionReason}
                </p>
              ) : null}
            </div>
            {!compact ? (
              <div className="flex items-center gap-4 text-xs tabular-nums text-subtle">
                <span className="flex items-center gap-1" title={fmt(t.common.views, { n: post.viewCount })}>
                  <Eye className="h-3.5 w-3.5" /> {post.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" /> {post.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" /> {post.comments}
                </span>
              </div>
            ) : null}
            <div className="flex items-center gap-1 sm:opacity-70 sm:transition sm:group-hover:opacity-100">
              <Link
                href={`/${locale}/dashboard?tab=editor&edit=${encodeURIComponent(post.slug)}`}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-primary"
                aria-label={`${t.common.edit}: ${post.title}`}
                title={t.common.edit}
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => remove(post)}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
                aria-label={`${t.common.delete}: ${post.title}`}
                title={t.common.delete}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
