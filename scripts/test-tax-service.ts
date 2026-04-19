/**
 * Tests unitarios de tax.service.
 *
 *   1. getCurrentUvt() con año en DB → número correcto
 *   2. getCurrentUvt() sin fila → throw AppError UVT_NOT_CONFIGURED
 *   3. getFiveUvtInCents() → uvt * 5 * 100
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/test-tax-service.ts
 *
 * NO requiere servidor corriendo. Sí requiere DATABASE_URL válido.
 * El test de "sin fila" simula el caso borrando la row del año actual
 * y restaurándola al final — cleanup es obligatorio.
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCurrentUvt, getFiveUvtInCents } from "../lib/services/tax.service";
import { AppError } from "../lib/utils/errors";

const passed: string[] = [];
const failed: string[] = [];

function log(icon: string, msg: string) {
  console.log(`  ${icon}  ${msg}`);
}

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed.push(name);
    log("✓", name);
  } else {
    failed.push(name);
    log("✗", `${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });

  const year = new Date().getUTCFullYear();
  const originalRow = await db.taxParameter.findUnique({ where: { year } });

  if (!originalRow) {
    console.error(
      `⚠  tax_parameters no tiene fila para ${year}. Corré seed-tax-parameters primero.`
    );
    process.exit(1);
  }

  try {
    // === [1] Happy path: año presente → número correcto ===
    console.log(`\n[1] getCurrentUvt() con año ${year} en DB`);
    const uvt = await getCurrentUvt();
    assert(
      "[1] retorna number > 0",
      typeof uvt === "number" && uvt > 0,
      `uvt=${uvt}`
    );
    assert(
      "[1] matchea fila DB",
      uvt === originalRow.uvt_cop,
      `got=${uvt} expected=${originalRow.uvt_cop}`
    );

    // === [2] getFiveUvtInCents() = uvt * 5 * 100 ===
    console.log("\n[2] getFiveUvtInCents()");
    const fiveUvt = await getFiveUvtInCents();
    assert(
      "[2] retorna uvt * 5 * 100",
      fiveUvt === uvt * 5 * 100,
      `got=${fiveUvt} expected=${uvt * 5 * 100}`
    );

    // === [3] Año sin fila → throw UVT_NOT_CONFIGURED ===
    console.log("\n[3] getCurrentUvt() sin fila → throw 503");
    await db.taxParameter.delete({ where: { year } });
    try {
      await getCurrentUvt();
      assert("[3] lanza AppError", false, "no lanzó");
    } catch (e) {
      if (e instanceof AppError) {
        assert(
          "[3] AppError con code UVT_NOT_CONFIGURED",
          e.code === "UVT_NOT_CONFIGURED",
          `code=${e.code}`
        );
        assert(
          "[3] statusCode 503",
          e.statusCode === 503,
          `status=${e.statusCode}`
        );
      } else {
        assert(
          "[3] AppError con code UVT_NOT_CONFIGURED",
          false,
          `tipo inesperado: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }
  } finally {
    // Restaurar fila borrada (si no existe — el test 3 la borró).
    const stillMissing = await db.taxParameter.findUnique({ where: { year } });
    if (!stillMissing) {
      await db.taxParameter.create({
        data: {
          year: originalRow.year,
          uvt_cop: originalRow.uvt_cop,
          source_resolution: originalRow.source_resolution,
        },
      });
      log("✓", `fila tax_parameters ${year} restaurada`);
    }
    await db.$disconnect();
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`  Resultado: ${passed.length} passed, ${failed.length} failed`);
  console.log("═══════════════════════════════════════\n");

  if (failed.length > 0) {
    failed.forEach((f) => console.log(`    ✗ ${f}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\nError fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
