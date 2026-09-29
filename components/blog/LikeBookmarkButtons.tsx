"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, Heart, Link2 } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { apiRequest, errorMessage } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Props = {
  postId: string;
  signedIn: boolean;
  initialLiked: boolean;
  initialBookmarked: boolean;
  likeCount: number;
};

export function LikeBookmarkButtons({ postId, signedIn, initialLiked, initialBookmarked, likeCount }: Props) {
  const { locale, t } = useI18n();
  const toast = useToast();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(likeCount);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [busy, setBusy] = useState<"like" | "bookmark" | null>(null);

  async function toggle(kind: "like" | "bookmark") {
    if (!signedIn) {
      toast(t.blog.loginToComment, "info");
      return;
    }
    setBusy(kind);
    // Optimistic update, rolled back if the request fails.
    const wasActive = kind === "like" ? liked : bookmarked;
    if (kind === "like") {
      setLiked(!wasActive);
      setLikes((value) => value + (wasActive ? -1 : 1));
    } else {
      setBookmarked(!wasActive);
    }
    try {
      const data = await apiRequest<{ active: boolean }>(kind === "like" ? "/api/likes" : "/api/bookmarks", { json: { postId } });
      if (kind === "bookmark") toast(data.active ? t.blog.bookmarked : t.blog.bookmark, "success");
    } catch (error) {
      if (kind === "like") {
        setLiked(wasActive);
        setLikes((value) => value + (wasActive ? 1 : -1));
      } else {
        setBookmarked(wasActive);
      }
      toast(errorMessage(error, t), "error");
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href.split("#")[0]);
      toast(t.common.linkCopied, "success");
    } catch {
      toast(window.location.href, "info");
    }
  }

  const pill =
    "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition active:scale-95 disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => toggle("like")}
        disabled={busy === "like"}
        aria-pressed={liked}
        className={cn(
          pill,
          liked ? "border-halo/40 bg-halo/10 text-halo" : "border-line bg-surface text-muted hover:border-halo/40 hover:text-halo",
        )}
      >
        <Heart className={cn("h-4 w-4 transition", liked && "scale-110 fill-current")} />
        {t.blog.like}
        <span className="tabular-nums opacity-80">{likes}</span>
      </button>
      <button
        type="button"
        onClick={() => toggle("bookmark")}
        disabled={busy === "bookmark"}
        aria-pressed={bookmarked}
        className={cn(
          pill,
          bookmarked
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-line bg-surface text-muted hover:border-primary/40 hover:text-primary",
        )}
      >
        <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
        {bookmarked ? t.blog.bookmarked : t.blog.bookmark}
      </button>
      <button type="button" onClick={copyLink} className={cn(pill, "border-line bg-surface text-muted hover:text-fg")}>
        <Link2 className="h-4 w-4" />
        {t.blog.copyLink}
      </button>
      {!signedIn ? (
        <Link href={`/${locale}/login`} className="ml-1 text-sm font-medium text-primary hover:underline">
          {t.nav.login} →
        </Link>
      ) : null}
    </div>
  );
}
