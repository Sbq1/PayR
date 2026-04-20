/**
 * Logger estructurado para Vercel + Sentry.
 *
 * - `info`/`warn` → console (Vercel Logs)
 * - `error`       → console + Sentry.captureMessage con el `event` como
 *   fingerprint. Esto habilita alertas en Sentry sobre eventos de negocio
 *   (p.ej. "webhook.hmac_failure") sin tener que tocar cada call site.
 *
 * Nota: NO llamar Sentry en dev (ensucia el feed). Gated por env.
 */

import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  event: string;
  timestamp: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * Intenta leer x-request-id del request actual. Retorna undefined si
 * no estamos en contexto de request (crons, scripts) — en ese caso el
 * log simplemente no lleva correlation ID.
 */
async function getRequestId(): Promise<string | undefined> {
  try {
    const h = await headers();
    return h.get("x-request-id") ?? undefined;
  } catch {
    return undefined;
  }
}

async function log(
  level: LogLevel,
  event: string,
  data?: Record<string, unknown>
) {
  const requestId = await getRequestId();
  const entry: LogEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
    ...data,
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(output);
      // Solo production/preview — dev no ensucia Sentry feed.
      if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development") {
        Sentry.captureMessage(event, {
          level: "error",
          tags: { event_type: event, ...(requestId ? { request_id: requestId } : {}) },
          extra: { ...data, ...(requestId ? { requestId } : {}) },
          fingerprint: [event], // dedupe por evento (todos los hmac_failure se agrupan)
        });
      }
      break;
    case "warn":
      console.warn(output);
      if (process.env.VERCEL_ENV === "production") {
        Sentry.captureMessage(event, {
          level: "warning",
          tags: { event_type: event, ...(requestId ? { request_id: requestId } : {}) },
          extra: { ...data, ...(requestId ? { requestId } : {}) },
          fingerprint: [event],
        });
      }
      break;
    default:
      console.log(output);
  }
}

// Note: log() es async ahora por headers() de Next, pero los callers
// suelen ser fire-and-forget (no await). Retornamos void explícitamente
// para preservar la API previa — si Next propaga una excepción será
// capturada por el unhandledRejection handler.
export const logger = {
  info: (event: string, data?: Record<string, unknown>): void => {
    void log("info", event, data);
  },
  warn: (event: string, data?: Record<string, unknown>): void => {
    void log("warn", event, data);
  },
  error: (event: string, data?: Record<string, unknown>): void => {
    void log("error", event, data);
  },
};
