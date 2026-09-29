import type { PostStatus } from "@prisma/client";
import { ApiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { canModerate, canPublishDirectly, canWrite, type Actor } from "@/lib/permissions";
import { slugify, uniqueSlug } from "@/lib/slug";
import { stripDangerousText } from "@/lib/security";
import type { postInputSchema } from "@/lib/validators";
import type { z } from "zod";

export async function resolveUniquePostSlug(title: string, requestedSlug?: string) {
  const base = requestedSlug ? slugify(requestedSlug) : slugify(title);
  for (let suffix = 0; suffix < 50; suffix += 1) {
    const slug = uniqueSlug(base, suffix || undefined);
    const exists = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
  }
  throw new ApiError("INVALID_INPUT", "Could not generate a unique slug.", 400);
}

export async function syncTags(postId: string, names: string[]) {
  await prisma.postTag.deleteMany({ where: { postId } });
  for (const raw of names.slice(0, 10)) {
    const name = stripDangerousText(raw).slice(0, 32);
    const slug = slugify(name);
    if (!name || !slug) continue;
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    await prisma.postTag.create({ data: { postId, tagId: tag.id } });
  }
}

export function serverStatus(actor: Actor, requested: PostStatus): PostStatus {
  if (requested === "PUBLISHED") {
    const reviewRequired = process.env.REQUIRE_POST_REVIEW !== "false";
    if (reviewRequired && !canPublishDirectly(actor) && !canModerate(actor)) {
      return "PENDING";
    }
    if (!canPublishDirectly(actor) && !canModerate(actor)) {
      throw new ApiError("POST_REVIEW_REQUIRED", "Your post must be reviewed before publishing.", 403);
    }
  }
  return requested;
}

export function assertCanWrite(actor: Actor) {
  if (!canWrite(actor)) {
    throw new ApiError("FORBIDDEN", "This account cannot create or edit posts.", 403);
  }
}

export function cleanPostInput(values: z.infer<typeof postInputSchema>) {
  return {
    ...values,
    title: stripDangerousText(values.title),
    excerpt: stripDangerousText(values.excerpt),
    coverImage: values.coverImage || null,
    seoTitle: values.seoTitle ? stripDangerousText(values.seoTitle) : null,
    seoDescription: values.seoDescription ? stripDangerousText(values.seoDescription) : null,
  };
}
