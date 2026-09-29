import type { OtpPurpose } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api-response";
import { verifyCsrf } from "@/lib/csrf";
import { consumeOtp } from "@/lib/otp-store";
import { assertJsonRequest } from "@/lib/security";
import { verifyOtpSchema } from "@/lib/validators";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    verifyCsrf(request);
    assertJsonRequest(request);
    const input = verifyOtpSchema.parse(await request.json());
    await consumeOtp(input.email, input.purpose as OtpPurpose, input.code);
    return ok({ message: "OTP verified." });
  } catch (error) {
    return handleApiError(error);
  }
}
