import type { NextRequest } from "next/server";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { verifyCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { sendOtpEmail } from "@/lib/mail";
import { createOtp } from "@/lib/otp-store";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertJsonRequest, getClientIp } from "@/lib/security";
import { sendOtpSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    assertJsonRequest(request);
    const input = sendOtpSchema.parse({ ...(await request.json()), purpose: "RESET_PASSWORD" });
    assertRateLimit(`forgot:${getClientIp(request)}:${input.email}`, 5, 3600);
    const user = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (user) {
      const code = await createOtp(input.email, "RESET_PASSWORD");
      try {
        await sendOtpEmail(input.email, code, "RESET_PASSWORD");
      } catch {
        throw new ApiError("SERVER_ERROR", "Could not send reset email. Please try again later.", 503);
      }
    }
    return ok({ message: "If the account exists, a reset OTP was sent." });
  } catch (error) {
    return handleApiError(error);
  }
}
