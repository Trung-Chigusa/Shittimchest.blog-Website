import type { OtpPurpose } from "@prisma/client";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";
import { verifyCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { sendOtpEmail } from "@/lib/mail";
import { createOtp } from "@/lib/otp-store";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertJsonRequest, getClientIp } from "@/lib/security";
import { sendOtpSchema } from "@/lib/validators";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function canReturnDebugOtp(email: string) {
  if (process.env.OTP_DEBUG_RESPONSE !== "true") return false;
  const allowlist = (process.env.OTP_DEBUG_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes("*") || allowlist.includes(email.toLowerCase());
}

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    assertJsonRequest(request);
    const input = sendOtpSchema.parse(await request.json());
    const ip = getClientIp(request);
    assertRateLimit(`send-otp:${ip}:${input.email}`, 1, 60);
    assertRateLimit(`send-otp-window:${ip}:${input.email}`, 5, 3600);

    if (input.purpose === "REGISTER") {
      const exists = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
      if (exists) throw new ApiError("EMAIL_ALREADY_EXISTS", "This email is already registered.", 409);
    }

    const code = await createOtp(input.email, input.purpose as OtpPurpose);
    let debugOtp: string | undefined;
    try {
      await sendOtpEmail(input.email, code, input.purpose);
    } catch {
      if (!canReturnDebugOtp(input.email)) {
        throw new ApiError("SERVER_ERROR", "Could not send OTP email. Please check SMTP settings.", 503);
      }
      debugOtp = code;
    }

    await auditLog({ request, action: "SEND_OTP", entityType: "OtpToken", entityId: input.email });
    return ok({ message: debugOtp ? "SMTP is not configured. Test OTP returned." : "OTP sent.", debugOtp });
  } catch (error) {
    return handleApiError(error);
  }
}
