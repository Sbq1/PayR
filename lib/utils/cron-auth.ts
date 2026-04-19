import { createHash } from "crypto";
import { safeEqualHex } from "./hmac";

/**
 * Verifica el header `Authorization: Bearer <CRON_SECRET>` de Vercel Cron.
 *
 * Compara sha256(header) vs sha256(env) en tiempo constante para evitar
 * timing sidechannels. Fail-closed si `CRON_SECRET` no está configurada
 * o el header no viene.
 */
export function verifyCronSecret(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return false;

  const a = createHash("sha256").update(token).digest("hex");
  const b = createHash("sha256").update(expected).digest("hex");
  return safeEqualHex(a, b);
}
