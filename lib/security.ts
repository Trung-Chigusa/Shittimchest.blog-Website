import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-response";

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function getUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") ?? "unknown";
}

export function assertJsonRequest(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError("INVALID_INPUT", "Request must be JSON.", 415);
  }
}

export function stripDangerousText(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

export function safeMetadata(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (key, item) => {
      if (/password|token|otp|secret|smtp/i.test(key)) return "[redacted]";
      return item;
    }),
  );
}
