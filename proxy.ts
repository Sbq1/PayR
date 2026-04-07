import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return new Uint8Array(0);
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPaths = [
    "/dashboard",
    "/settings",
    "/tables",
    "/qr-codes",
    "/orders",
    "/payments",
    "/upsells",
  ];

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("sc-session")?.value;

  if (!token) {
    return redirectToLogin(request, pathname);
  }

  // Verify JWT signature — not just existence
  try {
    const secret = getJwtSecret();
    if (secret.length === 0) {
      return redirectToLogin(request, pathname);
    }
    const { payload } = await jwtVerify(token, secret);
    const user = payload.user as { id?: string } | undefined;
    if (!user?.id) {
      return redirectToLogin(request, pathname);
    }
  } catch {
    // Invalid/expired token
    const response = redirectToLogin(request, pathname);
    response.cookies.delete("sc-session");
    return response;
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest, callbackUrl: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(loginUrl);
}

export const proxyConfig = {
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
