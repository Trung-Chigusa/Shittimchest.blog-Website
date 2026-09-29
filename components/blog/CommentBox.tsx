"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

async function csrfToken() {
  const response = await fetch("/api/auth/csrf", { credentials: "include" });
  const json = await response.json();
  return json.data.token as string;
}

export function CommentBox({ postId }: { postId: string }) {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setMessage("");
    try {
      const token = await csrfToken();
      const response = await fetch("/api/comments", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ postId, content }),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.message);
      setContent("");
      setMessage("Comment posted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to post comment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="glass-panel p-4">
      <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Share a careful note..." />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{message}</p>
        <Button onClick={submit} disabled={pending || !content.trim()} type="button">
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </div>
  );
}
