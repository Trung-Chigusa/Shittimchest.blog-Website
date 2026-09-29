import type { NextRequest } from "next/server";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { canModerate } from "@/lib/permissions";
import { assertJsonRequest, stripDangerousText } from "@/lib/security";
import { reviewSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    verifyCsrf(request);
    assertJsonRequest(request);
    const user = await requireUser(request);
    if (!canModerate(user)) throw new ApiError("FORBIDDEN", "Moderator or admin role required.", 403);
    const input = reviewSchema.parse(await request.json());
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) throw new ApiError("NOT_FOUND", "Post not found.", 404);

    const updated = await prisma.post.update({
      where: { id: post.id },
      data:
        input.action === "APPROVE"
          ? { status: "PUBLISHED", publishedAt: post.publishedAt ?? new Date(), rejectionReason: null }
          : { status: "REJECTED", rejectionReason: stripDangerousText(input.reason || "Rejected by moderator.") },
    });
    await auditLog({
      request,
      actorId: user.id,
      action: input.action === "APPROVE" ? "APPROVE_POST" : "REJECT_POST",
      entityType: "Post",
      entityId: post.id,
      metadata: { reason: input.reason },
    });
    return ok({ post: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
