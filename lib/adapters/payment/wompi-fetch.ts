import { PaymentError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

const WOMPI_SANDBOX = "https://sandbox.wompi.co";
const WOMPI_PRODUCTION = "https://production.wompi.co";
const DEFAULT_TIMEOUT_MS = 8_000;

export function getWompiBaseUrl(): string {
  const env = (process.env.WOMPI_ENVIRONMENT || "sandbox")
    .replace(/\\n|\n/g, "")
    .trim();
  return env === "production" ? WOMPI_PRODUCTION : WOMPI_SANDBOX;
}

interface WompiFetchOptions {
  method?: "GET" | "POST";
  bearerToken: string;
  body?: unknown;
  timeoutMs?: number;
}

interface WompiFetchContext {
  operation: string;
  reference?: string;
  transactionId?: string;
}

/**
 * Helper unificado para llamadas HTTP a Wompi API.
 *
 * Contrato:
 * - timeout / network / 5xx / 429 → logger.error + throw PaymentError con code.
 * - 4xx (no-429) → throw PaymentError SIN logger.error (business errors como 404
 *   en queries por referencia son esperados durante race con webhook).
 * - 2xx → retorna el JSON parseado como T.
 *
 * Los dos callsites prod (WompiAdapter.getTransaction y
 * payment.service.fetchWompiTransactionByReference) pasan por acá, de modo que
 * cualquier fallo transient queda visible en Sentry vía el tag event_type.
 */
export async function wompiFetch<T>(
  path: string,
  opts: WompiFetchOptions,
  context: WompiFetchContext
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = `${getWompiBaseUrl()}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        Authorization: `Bearer ${opts.bearerToken}`,
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    const event = isTimeout ? "wompi.timeout" : "wompi.network_error";
    logger.error(event, {
      ...context,
      timeoutMs,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new PaymentError(
      isTimeout
        ? `Timeout consultando Wompi (${timeoutMs}ms)`
        : `Error de red consultando Wompi`,
      isTimeout ? "WOMPI_TIMEOUT" : "WOMPI_NETWORK"
    );
  }

  if (!res.ok) {
    const isTransient = res.status >= 500 || res.status === 429;
    if (isTransient) {
      logger.error("wompi.5xx", {
        ...context,
        status: res.status,
      });
      throw new PaymentError(
        `Wompi respondió ${res.status} [transient]`,
        "WOMPI_5XX"
      );
    }
    throw new PaymentError(`Wompi respondió ${res.status}`, "WOMPI_ERROR");
  }

  return (await res.json()) as T;
}
