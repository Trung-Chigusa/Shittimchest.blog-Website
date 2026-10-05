import { NextResponse, type NextRequest } from "next/server";

const locales = ["vi", "en", "ja"];

// Any path segment starting with a dot (.env, .git, .gitkeep…), except /.well-known
const DOTFILE = /(^|\/)\.(?!well-known(\/|$))/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hidden files are never meant to be served; answer 404 instead of letting the
  // static file handler error out on them.
  if (DOTFILE.test(pathname)) {
    return new NextResponse("Not found", { status: 404 });
  }

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

  // Let the root layout set <html lang> for the active locale.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", first);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
