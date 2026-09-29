import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/dashboard/AdminPanel";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canModerate } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUserFromCookies();
  if (!user) redirect(`/${locale}/login`);
  if (!canModerate(user)) redirect(`/${locale}/dashboard`);

  const [totalUsers, totalPosts, publishedPosts, pendingPosts, draftPosts, posts] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.post.count({ where: { status: "PENDING" } }),
    prisma.post.count({ where: { status: "DRAFT" } }),
    prisma.post.findMany({
      include: {
        author: { select: { displayName: true, email: true } },
        category: { select: { name: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
    }),
  ]);

  return (
    <AdminPanel
      locale={locale}
      posts={posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        language: post.language,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        author: post.author,
        category: post.category,
      }))}
      stats={[
        { label: "Người dùng", value: totalUsers },
        { label: "Tổng bài", value: totalPosts },
        { label: "Đã đăng", value: publishedPosts },
        { label: "Chờ duyệt", value: pendingPosts },
        { label: "Nháp", value: draftPosts },
      ]}
    />
  );
}
