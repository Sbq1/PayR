import crypto from "node:crypto";
import { AppError } from "@/lib/utils/errors";

// Server-only. HMAC-SHA256 sobre `${tableId}:${version}` con QR_SECRET.
// Rotación fina vía qr_codes.token_version; rotación global del secret
// vía ventana dual (docs/runbooks/qr-secret-rotation.md).

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

export function signQrToken(tableId: string, tokenVersion: number): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${tableId}:${tokenVersion}`)
    .digest("base64url");
}

/** Nunca lanza — retorna false ante input inválido. Constant-time. */
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
