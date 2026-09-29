import type { NextRequest } from "next/server";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canModerate } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!canModerate(user)) throw new ApiError("FORBIDDEN", "Moderator or admin role required.", 403);
    const [users, posts, published, pending, categories] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.post.count({ where: { status: "PENDING" } }),
      prisma.category.findMany({ include: { _count: { select: { posts: true } } }, orderBy: { posts: { _count: "desc" } }, take: 5 }),
    ]);
    return ok({ users, posts, published, pending, categories });
  } catch (error) {
    return handleApiError(error);
  }
}
