import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// First gate for /admin/*: no session cookie means go straight to the login page.
// This only checks that the cookie EXISTS. The real check is the Express API (JWT verified on every
// /api/admin call) plus the dashboard's /api/auth/me call, so a forged cookie shows nothing.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  if (!request.cookies.has("mct_admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
