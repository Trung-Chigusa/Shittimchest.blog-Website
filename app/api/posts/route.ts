import type { NextRequest } from "next/server";
import type { PostStatus, Prisma } from "@prisma/client";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { assertCanWrite, cleanPostInput, resolveUniquePostSlug, serverStatus, syncTags } from "@/lib/post-service";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertJsonRequest, getClientIp } from "@/lib/security";
import { postInputSchema, postQuerySchema } from "@/lib/validators";
import { canModerate } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = postQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const where: Prisma.PostWhereInput = {
      status: "PUBLISHED",
      ...(query.language !== "all" ? { language: query.language } : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.tag ? { tags: { some: { tag: { slug: query.tag } } } } : {}),
      ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
    };
    const posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { displayName: true } },
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: query.sort === "popular" ? { viewCount: "desc" } : { publishedAt: "desc" },
      skip: (query.page - 1) * 12,
      take: 12,
    });
    return ok({ posts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    assertJsonRequest(request);
    const user = await requireUser(request);
    assertCanWrite(user);
    if (!canModerate(user)) {
      assertRateLimit(`create-post:${getClientIp(request)}:${user.id}`, 12, 24 * 3600);
    }

    const input = cleanPostInput(postInputSchema.parse(await request.json()));
    const category = await prisma.category.findUnique({ where: { id: input.categoryId }, select: { id: true } });
    if (!category) throw new ApiError("INVALID_INPUT", "Category does not exist.", 400);

    const status = serverStatus(user, input.status as PostStatus);
    const slug = await resolveUniquePostSlug(input.title, input.slug);
    const post = await prisma.post.create({
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        coverImage: input.coverImage,
        status,
        language: input.language,
        difficulty: input.difficulty,
        topicType: input.topicType,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        authorId: user.id,
        categoryId: input.categoryId,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });
    await syncTags(post.id, input.tags);
    await auditLog({ request, actorId: user.id, action: "CREATE_POST", entityType: "Post", entityId: post.id, metadata: { status } });
    return ok({ post }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
