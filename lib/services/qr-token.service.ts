import crypto from "node:crypto";
import { AppError } from "@/lib/utils/errors";

/**
 * Token HMAC para QR firmado.
 *
 * Flujo:
 * - `signQrToken(tableId, tokenVersion)` produce un token que se codifica
 *   en la URL del QR (o en un query param). El token es un HMAC-SHA256
 *   sobre el payload `${tableId}:${tokenVersion}` con `QR_SECRET`.
 * - `verifyQrToken(token, tableId, expectedVersion)` valida que el token
 *   coincida con la versión vigente del QR del `tableId`. Constant-time
 *   compare vía `crypto.timingSafeEqual` para prevenir timing attacks.
 *
 * Rotación:
 * - Por compromise específico de una mesa: incrementar
 *   `qr_codes.token_version` → el QR viejo falla verify.
 * - Por compromise global del secret: rotar `QR_SECRET` con ventana dual
 *   (runbook docs/runbooks/qr-secret-rotation.md, fase 5 del plan).
 *
 * Este módulo es servidor-only: nunca debe importarse en client components
 * porque expondría QR_SECRET en el bundle.
 */

const MIN_SECRET_LENGTH = 32;

function getSecret(): string {
  const s = process.env.QR_SECRET;
  if (!s || s.length < MIN_SECRET_LENGTH) {
    throw new AppError(
      `QR_SECRET no configurado o con longitud < ${MIN_SECRET_LENGTH}`,
      500,
      "QR_SECRET_MISSING"
    );
  }
  return s;
}

/**
 * Firma un token HMAC para el QR de una mesa en una versión específica.
 *
 * @param tableId    UUID de la mesa (debe venir del server, no del cliente)
 * @param tokenVersion versión actual del QR (desde `qr_codes.token_version`)
 * @returns token base64url (43 chars)
 */
export function signQrToken(tableId: string, tokenVersion: number): string {
  const payload = `${tableId}:${tokenVersion}`;
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

/**
 * Verifica un token QR contra la versión esperada.
 * Retorna `true` si el token es válido para esa combinación.
 *
 * Usa constant-time compare para evitar timing attacks.
 * Nunca lanza — retorna false ante cualquier input inválido.
 */
export function verifyQrToken(
  token: string,
  tableId: string,
  expectedVersion: number
): boolean {
  if (typeof token !== "string" || token.length === 0) return false;
  if (typeof tableId !== "string" || tableId.length === 0) return false;
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) return false;

  let expected: string;
  try {
    expected = signQrToken(tableId, expectedVersion);
  } catch {
    return false;
  }

  // length check antes de timingSafeEqual (esta lib requiere mismo length).
  // Expuesto pero no es un leak real: la longitud del HMAC SHA256 es pública.
  if (token.length !== expected.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}
