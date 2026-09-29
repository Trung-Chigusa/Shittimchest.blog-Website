import { NextResponse, type NextRequest } from "next/server";
import { ApiError, handleApiError } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertJsonRequest, getClientIp, stripDangerousText } from "@/lib/security";
import { registerSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    assertJsonRequest(request);
    const input = registerSchema.parse(await request.json());
    assertRateLimit(`register:${getClientIp(request)}:${input.email}`, 5, 3600);

    const exists = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (exists) throw new ApiError("EMAIL_ALREADY_EXISTS", "This email is already registered.", 409);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await hashPassword(input.password),
        displayName: stripDangerousText(input.displayName),
        emailVerified: true,
      },
    });
    await auditLog({ request, actorId: user.id, action: "REGISTER", entityType: "User", entityId: user.id });

    const response = NextResponse.json({ success: true, data: { user: { id: user.id, email: user.email, displayName: user.displayName } } });
    setSessionCookie(response, await signSession(user), true);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
