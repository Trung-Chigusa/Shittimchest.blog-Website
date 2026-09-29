import type { NextRequest } from "next/server";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!canManageUsers(user)) throw new ApiError("FORBIDDEN", "Admin role required.", 403);
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return ok({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
