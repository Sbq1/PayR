import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dashboard routes require authentication
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/settings") ||
      pathname.startsWith("/tables") || pathname.startsWith("/qr-codes") ||
      pathname.startsWith("/orders") || pathname.startsWith("/payments") ||
      pathname.startsWith("/upsells")) {
    const sessionCookie = request.cookies.get("sc-session")?.value;

    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/tables/:path*",
    "/qr-codes/:path*",
    "/orders/:path*",
    "/payments/:path*",
    "/upsells/:path*",
  ],
};
