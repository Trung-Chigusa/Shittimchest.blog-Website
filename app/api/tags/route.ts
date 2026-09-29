import type { NextRequest } from "next/server";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/permissions";
import { assertJsonRequest } from "@/lib/security";
import { slugify } from "@/lib/slug";
import { tagSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return ok({ tags });
}

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    assertJsonRequest(request);
    const user = await requireUser(request);
    if (!canManageUsers(user)) throw new ApiError("FORBIDDEN", "Admin role required.", 403);
    const input = tagSchema.parse(await request.json());
    const tag = await prisma.tag.upsert({
      where: { slug: slugify(input.name) },
      update: { name: input.name },
      create: { name: input.name, slug: slugify(input.name) },
    });
    return ok({ tag }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
