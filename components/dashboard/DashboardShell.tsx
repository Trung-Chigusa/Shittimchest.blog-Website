import Link from "next/link";
import { FilePenLine, FileText, LayoutDashboard, Shield, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { PostEditor } from "@/components/dashboard/PostEditor";
import { formatDate } from "@/lib/utils";

type DashboardShellProps = {
  locale: string;
  labels: Record<string, string>;
  user: {
    displayName: string;
    email: string;
    role: string;
  };
  categories: { id: string; name: string }[];
  posts: {
    id: string;
    title: string;
    slug: string;
    status: string;
    language: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    rejectionReason?: string | null;
    author?: { displayName: string; email: string } | null;
  }[];
};

const nav = [
  ["overview", LayoutDashboard],
  ["myPosts", FileText],
  ["newPost", FilePenLine],
  ["profile", UserRound],
  ["security", Shield],
] as const;

export function DashboardShell({ locale, labels, user, categories, posts }: DashboardShellProps) {
  const canSeeAllPosts = ["ADMIN", "MODERATOR"].includes(user.role);

  return (
    <main className="section-shell grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="glass-panel h-max p-3">
        <div className="border-b border-white/10 p-3">
          <p className="font-semibold text-white">{user.displayName}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{user.email}</p>
          <Badge className="mt-3">{user.role}</Badge>
        </div>
        <nav className="mt-3 grid gap-1">
          {nav.map(([key, Icon]) => (
            <a key={key} href={`#${key}`} className="flex items-center gap-2 rounded px-3 py-2 text-sm text-slate-300 hover:bg-white/8 hover:text-white">
              <Icon className="h-4 w-4 text-cyan-200" />
              {labels[key]}
            </a>
          ))}
        </nav>
      </aside>
      <div className="space-y-8">
        <section id="overview" className="glass-panel p-5">
          <p className="cyber-label">{labels.overview}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Metric label="Total posts" value={posts.length} />
            <Metric label="Published" value={posts.filter((post) => post.status === "PUBLISHED").length} />
            <Metric label="Pending" value={posts.filter((post) => post.status === "PENDING").length} />
          </div>
        </section>
        <section id="newPost">
          <div className="mb-4">
            <p className="cyber-label">{labels.newPost}</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Create a security note</h1>
          </div>
          <PostEditor categories={categories} labels={labels} />
        </section>
        <section id="myPosts" className="glass-panel p-5">
          <p className="cyber-label">{labels.myPosts}</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3">Title</th>
                  {canSeeAllPosts ? <th>Author</th> : null}
                  <th>Status</th>
                  <th>Language</th>
                  <th>Updated</th>
                  <th>Public</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {posts.map((post) => (
                  <tr key={post.id} className="text-slate-300">
                    <td className="max-w-sm py-3 pr-4">
                      <p className="font-medium text-white">{post.title}</p>
                      {post.rejectionReason ? <p className="mt-1 text-xs text-red-200">{post.rejectionReason}</p> : null}
                    </td>
                    {canSeeAllPosts ? (
                      <td>
                        <p>{post.author?.displayName ?? "Unknown"}</p>
                        <p className="mt-1 text-xs text-slate-500">{post.author?.email ?? ""}</p>
                      </td>
                    ) : null}
                    <td>
                      <Badge>{post.status}</Badge>
                    </td>
                    <td>{post.language.toUpperCase()}</td>
                    <td>{formatDate(post.updatedAt)}</td>
                    <td>
                      <Link className="text-cyan-200 hover:text-white" href={`/${locale}/blog/${post.slug}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/45 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
