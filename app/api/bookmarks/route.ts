import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { assertJsonRequest } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    assertJsonRequest(request);
    const user = await requireUser(request);
    const { postId } = (await request.json()) as { postId: string };
    const existing = await prisma.bookmark.findUnique({ where: { postId_userId: { postId, userId: user.id } } });
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return ok({ active: false });
    }
    await prisma.bookmark.create({ data: { postId, userId: user.id } });
    return ok({ active: true });
  } catch (error) {
    return handleApiError(error);
  }
}
