import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import type { User, UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api-response";
export { hashPassword, verifyPassword } from "@/lib/password";

export const SESSION_COOKIE = "wdt_session";

type SessionUser = Pick<User, "id" | "email" | "displayName" | "role" | "status" | "emailVerified">;

type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
};

export async function signSession(user: SessionUser, remember = false) {
  const maxAgeSeconds = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
  const secret = getJwtSecret();
  return new SignJWT({
    email: user.email,
    name: user.displayName,
    role: user.role,
    status: user.status,
  } satisfies Omit<SessionPayload, "sub">)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secret);
}

export async function readSession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session?.sub) return null;
  return prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

export async function getCurrentUserFromCookies() {
  const cookieStore = await cookies();
  const session = await readSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.sub) return null;
  return prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

export async function requireUser(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Please sign in to continue.", 401);
  }
  if (user.status === "BANNED") {
    throw new ApiError("FORBIDDEN", "This account is banned.", 403);
  }
  return user;
}

export function setSessionCookie(response: NextResponse, token: string, remember = false) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function getJwtSecret() {
  const raw = process.env.JWT_SECRET || process.env.AUTH_SECRET || "development-only-change-me";
  if (process.env.NODE_ENV === "production" && raw.includes("change-me")) {
    throw new Error("JWT_SECRET must be configured in production");
  }
  return new TextEncoder().encode(raw);
}
