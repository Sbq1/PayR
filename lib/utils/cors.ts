const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "https://checkout.wompi.co",
  "https://sandbox.wompi.co",
].filter(Boolean) as string[];

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") || "";
  const isAllowed =
    ALLOWED_ORIGINS.some((o) => origin.startsWith(o)) ||
    origin.includes("localhost") ||
    origin.includes("vercel.app");

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0] || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

/** Respuesta OPTIONS preflight */
export function handlePreflight(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
