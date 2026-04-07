import { createHash } from "crypto";

/**
 * Genera el checksum SHA256 para validar webhooks de Wompi.
 *
 * Wompi envia un array de propiedades (paths) que deben resolverse
 * del objeto transaction, concatenarse con timestamp y events_secret,
 * y hashearse con SHA256.
 */
export function generateWompiChecksum(
  properties: string[],
  transactionData: Record<string, unknown>,
  timestamp: number,
  eventsSecret: string
): string {
  const values = properties.map((prop) => {
    const keys = prop.split(".");
    let value: unknown = transactionData;
    for (const key of keys) {
      if (value && typeof value === "object") {
        value = (value as Record<string, unknown>)[key];
      } else {
        value = undefined;
      }
    }
    return String(value);
  });

  const concatenated = values.join("") + timestamp + eventsSecret;

  return createHash("sha256").update(concatenated).digest("hex");
}

/**
 * Genera la firma de integridad para el widget de Wompi.
 * Se usa al crear una transaccion desde el frontend.
 */
export function generateIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string
): string {
  const concatenated = `${reference}${amountInCents}${currency}${integritySecret}`;
  return createHash("sha256").update(concatenated).digest("hex");
}
