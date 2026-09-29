"use client";

import { useState } from "react";
import { Bookmark, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";

async function csrfToken() {
  const response = await fetch("/api/auth/csrf", { credentials: "include" });
  const json = await response.json();
  return json.data.token as string;
}

export function LikeBookmarkButtons({ postId }: { postId: string }) {
  const [message, setMessage] = useState("");

  async function mutate(url: string) {
    setMessage("");
    try {
      const token = await csrfToken();
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ postId }),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.message);
      setMessage(json.data.active ? "Saved." : "Removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please login first.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" onClick={() => mutate("/api/likes")}>
        <Heart className="h-4 w-4" />
        Like
      </Button>
      <Button type="button" variant="secondary" onClick={() => mutate("/api/bookmarks")}>
        <Bookmark className="h-4 w-4" />
        Bookmark
      </Button>
      <span className="text-sm text-slate-400">{message}</span>
    </div>
  );
}
