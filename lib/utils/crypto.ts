import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY env var is required");
  // Strip literal `\n` (bug común al poblar env vars desde CLI) y whitespace
  const key = raw.replace(/\\n|\n/g, "").trim();
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error(
      "ENCRYPTION_KEY debe ser 64 caracteres hex (32 bytes). Usa: openssl rand -hex 32"
    );
  }
  return Buffer.from(key, "hex");
}

/**
 * Encripta un string con AES-256-GCM.
 * Retorna: iv:encrypted:tag (hex encoded)
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${encrypted}:${tag.toString("hex")}`;
}

/**
 * Desencripta un string encriptado con encrypt().
 */
export function decrypt(encryptedText: string): string {
  const key = getKey();
  const [ivHex, encrypted, tagHex] = encryptedText.split(":");

  if (!ivHex || !encrypted || !tagHex) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
