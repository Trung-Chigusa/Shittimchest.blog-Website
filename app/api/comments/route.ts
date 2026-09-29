import type { NextRequest } from "next/server";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertJsonRequest, getClientIp, stripDangerousText } from "@/lib/security";
import { commentSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    assertJsonRequest(request);
    const user = await requireUser(request);
    if (user.status !== "ACTIVE") throw new ApiError("FORBIDDEN", "This account cannot comment.", 403);
    assertRateLimit(`comment:${getClientIp(request)}:${user.id}`, 20, 3600);
    const input = commentSchema.parse(await request.json());
    const post = await prisma.post.findFirst({ where: { id: input.postId, status: "PUBLISHED" }, select: { id: true } });
    if (!post) throw new ApiError("NOT_FOUND", "Post not found.", 404);
    const comment = await prisma.comment.create({
      data: { postId: input.postId, authorId: user.id, content: stripDangerousText(input.content) },
    });
    await auditLog({ request, actorId: user.id, action: "CREATE_COMMENT", entityType: "Comment", entityId: comment.id });
    return ok({ comment }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
