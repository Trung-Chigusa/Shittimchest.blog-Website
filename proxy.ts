import { NextResponse, type NextRequest } from "next/server";

const locales = ["vi", "en", "ja"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/uploads")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/vi";
    return NextResponse.redirect(url);
  }

  const first = pathname.split("/")[1];
  if (!locales.includes(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/vi${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
