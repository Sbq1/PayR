import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const COOKIE_NAME = "sc-session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const REFRESH_THRESHOLD_SECONDS = SESSION_TTL_SECONDS / 2;

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

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(request, pathname);
  }

  const secret = getJwtSecret();
  if (secret.length === 0) {
    return redirectToLogin(request, pathname);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const user = payload.user as { id?: string } | undefined;
    const sv = payload.sv as number | undefined;
    if (!user?.id || typeof sv !== "number") {
      return redirectToLogin(request, pathname);
    }

    const response = NextResponse.next();

    const exp = payload.exp;
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof exp === "number" && exp - nowSec < REFRESH_THRESHOLD_SECONDS) {
      const newToken = await new SignJWT({ user, sv })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
        .sign(secret);
      response.cookies.set(COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_TTL_SECONDS,
        path: "/",
      });
    }

    return response;
  } catch {
    const response = redirectToLogin(request, pathname);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
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
