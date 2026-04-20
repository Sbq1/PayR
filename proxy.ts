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

  // Correlation ID — propagado desde el cliente o generado acá.
  // Disponible en route handlers vía headers().get("x-request-id")
  // y en la response para debug desde el cliente.
  const requestId =
    request.headers.get("x-request-id") ?? crypto.randomUUID();
  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.set("x-request-id", requestId);

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
  if (!isProtected) {
    const res = NextResponse.next({ request: { headers: forwardHeaders } });
    res.headers.set("x-request-id", requestId);
    return res;
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(request, pathname, requestId);
  }

  const secret = getJwtSecret();
  if (secret.length === 0) {
    return redirectToLogin(request, pathname, requestId);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const user = payload.user as { id?: string } | undefined;
    const sv = payload.sv as number | undefined;
    if (!user?.id || typeof sv !== "number") {
      return redirectToLogin(request, pathname, requestId);
    }

    const response = NextResponse.next({ request: { headers: forwardHeaders } });
    response.headers.set("x-request-id", requestId);

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
    const response = redirectToLogin(request, pathname, requestId);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

function redirectToLogin(
  request: NextRequest,
  callbackUrl: string,
  requestId: string
) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  const res = NextResponse.redirect(loginUrl);
  res.headers.set("x-request-id", requestId);
  return res;
}

export const proxyConfig = {
  matcher: [
    // Correlation IDs en todo el tráfico relevante.
    "/api/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/tables/:path*",
    "/qr-codes/:path*",
    "/orders/:path*",
    "/payments/:path*",
    "/upsells/:path*",
  ],
};
