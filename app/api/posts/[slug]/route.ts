import type { NextRequest } from "next/server";
import type { PostStatus } from "@prisma/client";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { canEditPost } from "@/lib/permissions";
import { assertCanWrite, cleanPostInput, serverStatus, syncTags } from "@/lib/post-service";
import { assertJsonRequest } from "@/lib/security";
import { slugify } from "@/lib/slug";
import { postInputSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const post = await prisma.post.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        author: { select: { displayName: true, avatarUrl: true, bio: true } },
        category: true,
        tags: { include: { tag: true } },
      },
    });
    if (!post) throw new ApiError("NOT_FOUND", "Post not found.", 404);
    return ok({ post });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    verifyCsrf(request);
    assertJsonRequest(request);
    const user = await requireUser(request);
    assertCanWrite(user);
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (!existing) throw new ApiError("NOT_FOUND", "Post not found.", 404);
    if (!canEditPost(user, existing)) throw new ApiError("FORBIDDEN", "You cannot edit this post.", 403);

    const input = cleanPostInput(postInputSchema.parse(await request.json()));
    const nextSlug = input.slug ? slugify(input.slug) : existing.slug;
    if (nextSlug !== existing.slug) {
      const conflict = await prisma.post.findUnique({ where: { slug: nextSlug }, select: { id: true } });
      if (conflict) throw new ApiError("INVALID_INPUT", "Slug is already used.", 400);
    }
    const status = serverStatus(user, input.status as PostStatus);
    const post = await prisma.post.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        slug: nextSlug,
        excerpt: input.excerpt,
        content: input.content,
        coverImage: input.coverImage,
        categoryId: input.categoryId,
        language: input.language,
        difficulty: input.difficulty,
        topicType: input.topicType,
        status,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        publishedAt: status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt,
        rejectionReason: null,
      },
    });
    await syncTags(post.id, input.tags);
    await auditLog({ request, actorId: user.id, action: "UPDATE_POST", entityType: "Post", entityId: post.id, metadata: { status } });
    return ok({ post });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    verifyCsrf(request);
    const user = await requireUser(request);
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) throw new ApiError("NOT_FOUND", "Post not found.", 404);
    if (!canEditPost(user, post)) throw new ApiError("FORBIDDEN", "You cannot delete this post.", 403);
    await prisma.post.delete({ where: { id: post.id } });
    await auditLog({ request, actorId: user.id, action: "DELETE_POST", entityType: "Post", entityId: post.id });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
