import { NextResponse, type NextRequest } from "next/server";
import { ApiError, handleApiError } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { assertJsonRequest, getClientIp } from "@/lib/security";
import { assertLoginNotLocked, assertRateLimit, clearLoginFailures, recordLoginFailure } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  let email = "unknown";
  try {
    verifyCsrf(request);
    assertJsonRequest(request);
    const input = loginSchema.parse(await request.json());
    email = input.email;
    const lockKey = `${ip}:${input.email}`;
    assertLoginNotLocked(lockKey);
    assertRateLimit(`login:${lockKey}`, Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 5), Number(process.env.LOGIN_RATE_LIMIT_WINDOW ?? 60));

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const valid = user ? await verifyPassword(input.password, user.passwordHash) : false;
    if (!user || !valid) {
      recordLoginFailure(lockKey);
      await auditLog({ request, action: "LOGIN_FAILED", entityType: "User", entityId: input.email });
      throw new ApiError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }
    if (!user.emailVerified) throw new ApiError("UNAUTHORIZED", "Please verify your email first.", 401);
    if (user.status === "BANNED") throw new ApiError("FORBIDDEN", "This account is banned.", 403);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    clearLoginFailures(lockKey);
    await auditLog({ request, actorId: user.id, action: "LOGIN_SUCCESS", entityType: "User", entityId: user.id });

    const response = NextResponse.json({ success: true, data: { user: { id: user.id, email: user.email, role: user.role } } });
    setSessionCookie(response, await signSession(user, input.remember), input.remember);
    return response;
  } catch (error) {
    if (email !== "unknown") {
      await auditLog({ request, action: "LOGIN_ERROR", entityType: "User", entityId: email });
    }
    return handleApiError(error);
  }
}
