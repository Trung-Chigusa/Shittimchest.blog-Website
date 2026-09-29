import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { canModerate } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUserFromCookies();
  if (!user) redirect(`/${locale}/login`);
  if (user.status !== "ACTIVE") redirect(`/${locale}`);

  const canSeeAllPosts = canModerate(user);

  const [categories, posts] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.post.findMany({
      where: canSeeAllPosts ? {} : { authorId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        rejectionReason: true,
        author: { select: { displayName: true, email: true } },
      },
    }),
  ]);

  return (
    <DashboardShell
      locale={locale}
      labels={getDictionary(locale).dashboard}
      user={user}
      categories={categories}
      posts={posts}
    />
  );
}
