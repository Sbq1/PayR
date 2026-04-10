/**
 * Script one-off para rotar ENCRYPTION_KEY sin perder datos.
 *
 * Campos encriptados (en tabla `restaurants`):
 *   - wompi_private_key
 *   - wompi_events_secret
 *   - wompi_integrity_secret
 *   - siigo_username
 *   - siigo_access_key
 *
 * Uso:
 *
 *   # 1. Dry-run (default) — solo cuenta filas, no escribe
 *   OLD_ENCRYPTION_KEY=<hex64> NEW_ENCRYPTION_KEY=<hex64> \
 *     npx tsx scripts/rotate-encryption-key.ts
 *
 *   # 2. Run real — aplica cambios
 *   OLD_ENCRYPTION_KEY=<hex64> NEW_ENCRYPTION_KEY=<hex64> DRY_RUN=false \
 *     npx tsx scripts/rotate-encryption-key.ts
 *
 * IMPORTANTE:
 *   - Después del run real, debes actualizar ENCRYPTION_KEY en Vercel
 *     al valor NEW y redesplegar INMEDIATAMENTE.
 *   - Durante la ventana entre "run real" y "redeploy", Vercel aún tiene
 *     OLD_ENCRYPTION_KEY y no podrá descifrar los datos. Hay ~1-2 min
 *     de downtime en el flujo de pagos.
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

const OLD_KEY_HEX = (process.env.OLD_ENCRYPTION_KEY || "").replace(/\\n|\n/g, "").trim();
const NEW_KEY_HEX = (process.env.NEW_ENCRYPTION_KEY || "").replace(/\\n|\n/g, "").trim();
const DRY_RUN = process.env.DRY_RUN !== "false";

const ENCRYPTED_FIELDS = [
  "wompi_private_key",
  "wompi_events_secret",
  "wompi_integrity_secret",
  "siigo_username",
  "siigo_access_key",
] as const;

type EncryptedField = (typeof ENCRYPTED_FIELDS)[number];

function decryptWithKey(encryptedText: string, keyHex: string): string {
  const key = Buffer.from(keyHex, "hex");
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error(`bad format (expected iv:data:tag, got ${parts.length} parts)`);
  }
  const [ivHex, encrypted, tagHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function encryptWithKey(text: string, keyHex: string): string {
  const key = Buffer.from(keyHex, "hex");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${encrypted}:${tag.toString("hex")}`;
}

function validateKey(name: string, hex: string): void {
  if (!hex) {
    console.error(`ERROR: ${name} is required`);
    process.exit(1);
  }
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    console.error(`ERROR: ${name} must be 64 hex chars (got ${hex.length})`);
    process.exit(1);
  }
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  ENCRYPTION_KEY rotation");
  console.log("═══════════════════════════════════════════");

  validateKey("OLD_ENCRYPTION_KEY", OLD_KEY_HEX);
  validateKey("NEW_ENCRYPTION_KEY", NEW_KEY_HEX);

  if (OLD_KEY_HEX === NEW_KEY_HEX) {
    console.error("ERROR: OLD and NEW keys are identical. Aborting.");
    process.exit(1);
  }

  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "WRITE (applying changes)"}`);
  console.log(`OLD key: ${OLD_KEY_HEX.slice(0, 8)}...${OLD_KEY_HEX.slice(-4)}`);
  console.log(`NEW key: ${NEW_KEY_HEX.slice(0, 8)}...${NEW_KEY_HEX.slice(-4)}`);
  console.log("");

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });

  const restaurants = await db.restaurant.findMany();
  console.log(`Found ${restaurants.length} restaurant(s)`);
  console.log("");

  let totalFieldsToRotate = 0;
  let totalErrors = 0;
  const plannedUpdates: Array<{ id: string; slug: string; updates: Partial<Record<EncryptedField, string>> }> = [];

  for (const rest of restaurants) {
    console.log(`[${rest.slug}] (id: ${rest.id})`);
    const updates: Partial<Record<EncryptedField, string>> = {};
    let fieldErrors = 0;

    for (const field of ENCRYPTED_FIELDS) {
      const value = rest[field];
      if (!value) {
        console.log(`  ⊘ ${field}: null/empty`);
        continue;
      }

      try {
        const decrypted = decryptWithKey(value, OLD_KEY_HEX);
        const reEncrypted = encryptWithKey(decrypted, NEW_KEY_HEX);

        // Verificación: descifrar con NEW_KEY debe devolver el valor original
        const verify = decryptWithKey(reEncrypted, NEW_KEY_HEX);
        if (verify !== decrypted) {
          throw new Error("round-trip verification failed");
        }

        updates[field] = reEncrypted;
        totalFieldsToRotate++;
        console.log(`  ✓ ${field}: decrypt+encrypt+verify OK`);
      } catch (e: any) {
        fieldErrors++;
        totalErrors++;
        console.error(`  ✗ ${field}: ${e.message}`);
      }
    }

    if (fieldErrors > 0) {
      console.error(`  ⚠ ${fieldErrors} error(s) in this restaurant — skipping updates`);
    } else if (Object.keys(updates).length > 0) {
      plannedUpdates.push({ id: rest.id, slug: rest.slug, updates });
    }
    console.log("");
  }

  console.log("═══════════════════════════════════════════");
  console.log(`  Summary: ${totalFieldsToRotate} fields to rotate across ${plannedUpdates.length} restaurant(s)`);
  console.log(`  Errors: ${totalErrors}`);
  console.log("═══════════════════════════════════════════");

  if (totalErrors > 0) {
    console.error("\nAborting due to errors. Fix them and re-run.");
    await db.$disconnect();
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No changes written. Set DRY_RUN=false to apply.");
    await db.$disconnect();
    return;
  }

  console.log("\nApplying changes in a transaction...");
  await db.$transaction(async (tx) => {
    for (const { id, slug, updates } of plannedUpdates) {
      await tx.restaurant.update({
        where: { id },
        data: updates,
      });
      console.log(`  ✓ Updated ${slug}`);
    }
  });

  console.log("\nDone. All fields re-encrypted with NEW key.");
  console.log("\nNEXT STEPS:");
  console.log("  1. Update ENCRYPTION_KEY in Vercel to NEW value IMMEDIATELY");
  console.log("  2. Redeploy production (vercel --prod)");
  console.log("  3. Until redeploy finishes, payment flow is BROKEN");

  await db.$disconnect();
}

main().catch((e) => {
  console.error("\nFatal error:", e.message);
  process.exit(1);
});
