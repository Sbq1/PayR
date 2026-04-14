import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";

const WOMPI_PUB_RE = /^pub_(test|prod)_[A-Za-z0-9]+$/;
const WOMPI_PRV_RE = /^prv_(test|prod)_[A-Za-z0-9]+$/;
const FETCH_TIMEOUT_MS = 5_000;
const WOMPI_SANDBOX = "https://sandbox.wompi.co";
const WOMPI_PRODUCTION = "https://production.wompi.co";

const limiter = rateLimit("wompi-test", {
  interval: 60 * 60 * 1000, // 1 hora
  limit: 10,
});

const bodySchema = z
  .object({
    publicKey: z.string().regex(WOMPI_PUB_RE),
    privateKey: z.string().regex(WOMPI_PRV_RE),
  })
  .refine(
    (data) => {
      const pubEnv = data.publicKey.includes("test_") ? "test" : "prod";
      const prvEnv = data.privateKey.includes("test_") ? "test" : "prod";
      return pubEnv === prvEnv;
    },
    { message: "Public y private key son de entornos distintos" },
  );

function getWompiBaseUrl(publicKey: string): string {
  return publicKey.includes("test_") ? WOMPI_SANDBOX : WOMPI_PRODUCTION;
}

function networkErrorMessage(err: unknown, action: string): string {
  if (err instanceof Error && err.name === "TimeoutError") {
    return `Timeout ${action}`;
  }
  return `Error de red ${action}`;
}

/**
 * POST /api/restaurant/[id]/test-payment
 *
 * Verifica live contra Wompi que las credenciales son reales.
 * No persiste nada — solo retorna { valid, merchant?, error? }.
 *
 * Two-step:
 *  1. GET /v1/merchants/{publicKey} (público) → valida public_key
 *  2. GET /v1/transactions?limit=1 con Bearer privateKey → valida private_key
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await limiter.check(`user:${session.user.id}`);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    if (session.user.restaurantId !== restaurantId) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { valid: false, error: "Credenciales con formato inválido" },
        { status: 400 },
      );
    }

    const { publicKey, privateKey } = parsed.data;
    const baseUrl = getWompiBaseUrl(publicKey);

    // Step 1: verificar public_key (endpoint público de Wompi)
    let merchantInfo: { id: string; name: string; email: string } | null = null;
    try {
      const res = await fetch(`${baseUrl}/v1/merchants/${publicKey}`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (res.status === 404) {
        return Response.json({
          valid: false,
          error: "Public key inválida — Wompi no reconoce este merchant",
        });
      }
      if (!res.ok) {
        return Response.json({
          valid: false,
          error: `Wompi devolvió ${res.status} validando public key`,
        });
      }
      const json = await res.json();
      merchantInfo = {
        id: json.data?.id ?? "",
        name: json.data?.name ?? "",
        email: json.data?.email ?? "",
      };
    } catch (err) {
      return Response.json({
        valid: false,
        error: networkErrorMessage(err, "consultando merchant en Wompi"),
      });
    }

    // Step 2: verificar private_key con request autenticada
    try {
      const res = await fetch(`${baseUrl}/v1/transactions?limit=1`, {
        headers: { Authorization: `Bearer ${privateKey}` },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (res.status === 401) {
        return Response.json({
          valid: false,
          error: "Private key inválida — autenticación rechazada por Wompi",
        });
      }
      if (!res.ok) {
        return Response.json({
          valid: false,
          error: `Wompi devolvió ${res.status} validando private key`,
        });
      }
    } catch (err) {
      return Response.json({
        valid: false,
        error: networkErrorMessage(err, "validando private key en Wompi"),
      });
    }

    return Response.json({
      valid: true,
      merchant: merchantInfo,
      environment: publicKey.includes("test_") ? "sandbox" : "production",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
