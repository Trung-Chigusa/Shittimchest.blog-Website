import type { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { consumeOtp } from "@/lib/otp-store";
import { assertJsonRequest } from "@/lib/security";
import { resetPasswordSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    assertJsonRequest(request);
    const input = resetPasswordSchema.parse(await request.json());
    await consumeOtp(input.email, "RESET_PASSWORD", input.otpCode);
    const user = await prisma.user.update({
      where: { email: input.email },
      data: { passwordHash: await hashPassword(input.password) },
    });
    await auditLog({ request, actorId: user.id, action: "RESET_PASSWORD", entityType: "User", entityId: user.id });
    return ok({ message: "Password updated." });
  } catch (error) {
    return handleApiError(error);
  }
}
