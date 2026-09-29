import type { NextRequest } from "next/server";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/permissions";
import { assertJsonRequest } from "@/lib/security";
import { slugify } from "@/lib/slug";
import { categorySchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return ok({ categories });
}

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    assertJsonRequest(request);
    const user = await requireUser(request);
    if (!canManageUsers(user)) throw new ApiError("FORBIDDEN", "Admin role required.", 403);
    const input = categorySchema.parse(await request.json());
    const category = await prisma.category.create({
      data: { ...input, slug: input.slug ? slugify(input.slug) : slugify(input.name) },
    });
    await auditLog({ request, actorId: user.id, action: "CREATE_CATEGORY", entityType: "Category", entityId: category.id });
    return ok({ category }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
