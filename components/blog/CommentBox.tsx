"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { apiRequest, errorMessage } from "@/lib/client-api";

const MAX = 1200;

export function CommentBox({ postId, userName }: { postId: string; userName: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setPending(true);
    try {
      await apiRequest("/api/comments", { json: { postId, content } });
      setContent("");
      toast(t.blog.commentPosted, "success");
      router.refresh(); // re-render the server list so the new comment shows up
    } catch (error) {
      toast(errorMessage(error, t), "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-3">
      <Avatar name={userName} size="md" className="hidden sm:grid" />
      <div className="flex-1 rounded-2xl border border-line bg-surface shadow-sm transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
        <label htmlFor="comment" className="sr-only">
          {t.blog.comments}
        </label>
        <textarea
          id="comment"
          value={content}
          maxLength={MAX}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") submit(event);
          }}
          placeholder={t.blog.commentPlaceholder}
          rows={3}
          className="block w-full resize-y rounded-t-2xl bg-transparent px-4 pt-3.5 text-sm leading-relaxed text-fg outline-none placeholder:text-subtle"
        />
        <div className="flex items-center justify-between gap-3 px-3 pb-3">
          <span className="text-xs tabular-nums text-subtle">
            {content.length}/{MAX}
          </span>
          <Button type="submit" size="sm" disabled={pending || !content.trim()}>
            {pending ? <Loader2 className="animate-spin" /> : <Send />}
            {t.blog.commentSend}
          </Button>
        </div>
      </div>
    </form>
  );
}
