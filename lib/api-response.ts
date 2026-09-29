import { NextResponse } from "next/server";

export type ErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "OTP_EXPIRED"
  | "OTP_INVALID"
  | "EMAIL_ALREADY_EXISTS"
  | "INVALID_CREDENTIALS"
  | "POST_REVIEW_REQUIRED"
  | "SERVER_ERROR";

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(code: ErrorCode, message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      code,
      message,
    },
    { status },
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.code, error.message, error.status);
  }

  console.error("[server-error]", sanitizeError(error));
  return fail("SERVER_ERROR", "Something went wrong. Please try again later.", 500);
}

function sanitizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message.replace(/postgresql:\/\/[^@]+@/gi, "postgresql://***@"),
    };
  }
  return { message: "Unknown error" };
}
