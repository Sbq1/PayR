import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/restaurant/*/qr/table/*/printable": [
      "./node_modules/pdfkit/js/data/**/*",
    ],
    "/api/restaurant/[restaurantId]/qr/table/[tableId]/printable/route": [
      "./node_modules/pdfkit/js/data/**/*",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    // CSP scripts:
    //  - 'unsafe-inline' permanece (Next.js inyecta scripts inline; migrar a
    //    nonce-based requiere refactor no-trivial del App Router — TODO).
    //  - 'unsafe-eval' solo en dev (HMR/React Refresh lo requieren); en prod
    //    lo removemos para reducir superficie de ataque (CSP Level 3).
    const scriptSrc = [
      "script-src",
      "'self'",
      "'unsafe-inline'",
      ...(isProd ? [] : ["'unsafe-eval'"]),
      "https://cdn.wompi.co",
      "https://checkout.wompi.co",
    ].join(" ");

    const csp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co https://production.wompi.co https://sandbox.wompi.co https://*.ingest.sentry.io",
      "frame-src https://checkout.wompi.co",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; ");

    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      { key: "Content-Security-Policy", value: csp },
    ];

    if (isProd) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
