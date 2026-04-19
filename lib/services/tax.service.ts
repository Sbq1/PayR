import { db } from "@/lib/db";
import { AppError } from "@/lib/utils/errors";

/**
 * UVT vigente del año actual desde `tax_parameters`.
 *
 * DIAN publica el UVT anual por Resolución (ej. Res. 193/2024 → UVT 2026 =
 * $51.736 COP). NUNCA hardcoded ni env var: un UVT desactualizado genera
 * rechazos silenciosos de factura electrónica.
 *
 * `scripts/seed-tax-parameters.ts` inserta el año siguiente antes del 1
 * de enero. Si el año actual no está cargado se lanza 503 — debe disparar
 * alerta crítica al equipo antes de que un comensal vea el error.
 */
export async function getCurrentUvt(): Promise<number> {
  const year = new Date().getUTCFullYear();
  const row = await db.taxParameter.findUnique({
    where: { year },
    select: { uvt_cop: true },
  });

  if (!row) {
    throw new AppError(
      `UVT para año ${year} no cargado. Contacta soporte.`,
      503,
      "UVT_NOT_CONFIGURED"
    );
  }

  return row.uvt_cop;
}

/**
 * 5 UVT en centavos COP. Umbral DIAN para factura electrónica.
 *
 * Ej. 2026: 51.736 × 5 × 100 = 25.868.000 centavos = $258.680 COP.
 *
 * Caller debe cachear el valor si hace varias comparaciones en la misma
 * request — cada invocación es una query a `tax_parameters`.
 */
export async function getFiveUvtInCents(): Promise<number> {
  return (await getCurrentUvt()) * 5 * 100;
}
