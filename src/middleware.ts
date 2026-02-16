import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "subfeed_session";
const PUBLIC_PATHS = ["/login", "/api/auth"];

/**
 * Auth middleware -- checks for the session cookie and redirects to /login
 * if missing. Uses Edge runtime for Cloudflare Workers compatibility.
 *
 * Does NOT access Cloudflare env -- the real password verification
 * happens in the /api/auth routes. The GET /api/auth endpoint
 * auto-grants a cookie when SITE_PASSWORD is not configured.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);

  if (!session?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
