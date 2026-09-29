"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Search, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";

async function csrfToken() {
  const response = await fetch("/api/auth/csrf", { credentials: "include" });
  const json = await response.json();
  return json.data.token as string;
}

type AdminPost = {
  id: string;
  title: string;
  slug: string;
  status: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  author: { displayName: string; email: string };
  category: { name: string };
};

const statusOptions = ["ALL", "PUBLISHED", "PENDING", "DRAFT", "REJECTED"] as const;

export function AdminPanel({
  locale,
  posts,
  stats,
}: {
  locale: string;
  posts: AdminPost[];
  stats: { label: string; value: number }[];
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("ALL");

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts.filter((post) => {
      const statusMatch = status === "ALL" || post.status === status;
      const queryMatch =
        !normalized ||
        post.title.toLowerCase().includes(normalized) ||
        post.slug.toLowerCase().includes(normalized) ||
        post.author.displayName.toLowerCase().includes(normalized) ||
        post.author.email.toLowerCase().includes(normalized) ||
        post.category.name.toLowerCase().includes(normalized);
      return statusMatch && queryMatch;
    });
  }, [posts, query, status]);

  async function review(slug: string, action: "APPROVE" | "REJECT") {
    setMessage("");
    try {
      const token = await csrfToken();
      const response = await fetch(`/api/posts/${slug}/review`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ action, reason }),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.message);
      setMessage(action === "APPROVE" ? "Đã duyệt bài." : "Đã từ chối bài.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không xử lý được bài.");
    }
  }

  async function deletePost(slug: string, title: string) {
    if (!window.confirm(`Gỡ bài "${title}" khỏi hệ thống?`)) return;
    setMessage("");
    try {
      const token = await csrfToken();
      const response = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "x-csrf-token": token },
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.message);
      setMessage("Đã gỡ bài.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không gỡ được bài.");
    }
  }

  return (
    <main className="section-shell space-y-8 py-8">
      <section className="glass-panel p-5">
        <p className="cyber-label">Admin Console</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Quản lý bài đăng</h1>
        <div className="mt-5 grid gap-4 md:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-md border border-white/10 bg-slate-950/45 p-4">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_1fr]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tiêu đề, slug, tác giả, danh mục"
              className="pl-9"
            />
          </label>
          <Select value={status} onChange={(event) => setStatus(event.target.value as (typeof statusOptions)[number])}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "Tất cả" : option}
              </option>
            ))}
          </Select>
          <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Lý do từ chối" />
        </div>

        {message ? <p className="mt-4 rounded-md border border-cyan-200/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">{message}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-4">Bài viết</th>
                <th>Tác giả</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th>Cập nhật</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredPosts.length ? (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="text-slate-300">
                    <td className="max-w-sm py-3 pr-4">
                      <p className="font-medium text-white">{post.title}</p>
                      <p className="mt-1 text-xs text-slate-500">/{post.slug}</p>
                    </td>
                    <td>
                      <p>{post.author.displayName}</p>
                      <p className="mt-1 text-xs text-slate-500">{post.author.email}</p>
                    </td>
                    <td>{post.category.name}</td>
                    <td>
                      <Badge>{post.status}</Badge>
                    </td>
                    <td>{formatDate(post.updatedAt)}</td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-2">
                        {post.status === "PENDING" ? (
                          <>
                            <Button type="button" className="h-9 px-3" onClick={() => review(post.slug, "APPROVE")}>
                              <CheckCircle2 className="h-4 w-4" />
                              Duyệt
                            </Button>
                            <Button type="button" className="h-9 px-3" variant="secondary" onClick={() => review(post.slug, "REJECT")}>
                              <XCircle className="h-4 w-4" />
                              Từ chối
                            </Button>
                          </>
                        ) : null}
                        <Link
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 text-sm font-semibold text-white transition hover:border-cyan-200/60 hover:bg-cyan-200/10"
                          href={`/${locale}/blog/${post.slug}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Mở
                        </Link>
                        <Button type="button" className="h-9 px-3" variant="danger" onClick={() => deletePost(post.slug, post.title)}>
                          <Trash2 className="h-4 w-4" />
                          Gỡ
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">Không có bài phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
