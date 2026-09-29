import type { OtpPurpose } from "@prisma/client";
import { ApiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { generateOtpCode, hashOtp, maxOtpAttempts, otpExpiryDate, verifyOtpHash } from "@/lib/otp";

export async function createOtp(email: string, purpose: OtpPurpose) {
  const code = generateOtpCode();
  await prisma.otpToken.create({
    data: {
      email,
      purpose,
      codeHash: await hashOtp(email, purpose, code),
      expiresAt: otpExpiryDate(),
    },
  });
  return code;
}

export async function consumeOtp(email: string, purpose: OtpPurpose, code: string) {
  const token = await prisma.otpToken.findFirst({
    where: {
      email,
      purpose,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    throw new ApiError("OTP_INVALID", "OTP is invalid.", 400);
  }

  if (token.expiresAt < new Date()) {
    await prisma.otpToken.update({ where: { id: token.id }, data: { consumedAt: new Date() } });
    throw new ApiError("OTP_EXPIRED", "OTP has expired. Please request a new code.", 400);
  }

  if (token.attempts >= maxOtpAttempts()) {
    throw new ApiError("OTP_INVALID", "OTP attempts exceeded. Please request a new code.", 400);
  }

  const valid = await verifyOtpHash(email, purpose, code, token.codeHash);
  if (!valid) {
    await prisma.otpToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } });
    throw new ApiError("OTP_INVALID", "OTP is invalid.", 400);
  }

  await prisma.otpToken.update({ where: { id: token.id }, data: { consumedAt: new Date() } });
}
