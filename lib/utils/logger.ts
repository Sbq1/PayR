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

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  event: string;
  timestamp: string;
  [key: string]: unknown;
}

function log(level: LogLevel, event: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
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
          tags: { event_type: event },
          extra: data,
          fingerprint: [event], // dedupe por evento (todos los hmac_failure se agrupan)
        });
      }
      break;
    case "warn":
      console.warn(output);
      if (process.env.VERCEL_ENV === "production") {
        Sentry.captureMessage(event, {
          level: "warning",
          tags: { event_type: event },
          extra: data,
          fingerprint: [event],
        });
      }
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  info: (event: string, data?: Record<string, unknown>) => log("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => log("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => log("error", event, data),
};
