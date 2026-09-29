import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

export function generateOtpCode() {
  return randomInt(100000, 1_000_000).toString();
}

export async function hashOtp(email: string, purpose: string, code: string) {
  return bcrypt.hash(otpPayload(email, purpose, code), 12);
}

export async function verifyOtpHash(email: string, purpose: string, code: string, hash: string) {
  return bcrypt.compare(otpPayload(email, purpose, code), hash);
}

export function otpExpiryDate() {
  const minutes = Number(process.env.OTP_EXPIRES_MINUTES ?? 5);
  return new Date(Date.now() + minutes * 60_000);
}

export function maxOtpAttempts() {
  return Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
}

function otpPayload(email: string, purpose: string, code: string) {
  return `${email.trim().toLowerCase()}:${purpose}:${code.trim()}`;
}
