/**
 * Seed del UVT anual en `tax_parameters`.
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/seed-tax-parameters.ts <year> <uvt_cop> [source]
 *
 * Ejemplo (preparar 2027 antes del 1 de enero 2027):
 *   npx tsx --env-file=.env.local scripts/seed-tax-parameters.ts 2027 52700 "DIAN Res. XXX/2026"
 *
 * DIAN publica el UVT anual por resolución cada diciembre. Este script
 * debe correrse manualmente en noviembre/diciembre de cada año para el
 * siguiente. Si el 1 de enero amanece sin fila, `getCurrentUvt()` lanza
 * 503 UVT_NOT_CONFIGURED y todo el flujo de pagos se detiene — disparar
 * alerta al equipo antes de fin de año.
 *
 * Verificación anti-duplicado: si el año ya existe, el script aborta
 * sin sobrescribir. Para modificar un valor ya cargado, borrar manual
 * primero (`DELETE FROM tax_parameters WHERE year = X`).
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function usage(): never {
  console.error(
    "Uso: npx tsx scripts/seed-tax-parameters.ts <year> <uvt_cop> [source_resolution]"
  );
  console.error("Ejemplo: seed-tax-parameters.ts 2027 52700 'DIAN Res. 193/2026'");
  process.exit(1);
}

async function main() {
  const [, , yearArg, uvtArg, sourceArg] = process.argv;

  if (!yearArg || !uvtArg) usage();

  const year = Number(yearArg);
  const uvtCop = Number(uvtArg);
  const source = sourceArg ?? null;

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    console.error(`❌ year inválido: ${yearArg}. Esperado entero 2000-2100.`);
    process.exit(1);
  }
  if (!Number.isInteger(uvtCop) || uvtCop <= 0 || uvtCop > 1_000_000) {
    console.error(
      `❌ uvt_cop inválido: ${uvtArg}. Esperado entero positivo (ej. 51736).`
    );
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });

  try {
    const existing = await db.taxParameter.findUnique({ where: { year } });
    if (existing) {
      console.error(
        `❌ Ya existe fila para año ${year}:\n` +
          `   uvt_cop=${existing.uvt_cop}, source=${existing.source_resolution ?? "(null)"}\n` +
          `   Para modificar: DELETE manual primero.`
      );
      process.exit(1);
    }

    const row = await db.taxParameter.create({
      data: {
        year,
        uvt_cop: uvtCop,
        source_resolution: source,
      },
    });

    const fiveUvt = row.uvt_cop * 5 * 100;
    console.log("✓ UVT insertado:");
    console.log(`  año            = ${row.year}`);
    console.log(`  uvt_cop        = $${row.uvt_cop.toLocaleString("es-CO")}`);
    console.log(`  5 UVT en cents = ${fiveUvt.toLocaleString("es-CO")}`);
    console.log(`  5 UVT en COP   = $${(fiveUvt / 100).toLocaleString("es-CO")}`);
    console.log(`  source         = ${row.source_resolution ?? "(null)"}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error("\nError fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
