import { db } from "@/lib/db";
import { AppError } from "@/lib/utils/errors";

/**
 * Retorna el UVT vigente para el año actual desde `tax_parameters`.
 *
 * El UVT se actualiza anualmente por Resolución DIAN. Un script
 * (`scripts/seed-tax-parameters.ts`) debe insertar el año siguiente
 * antes del 1 de enero. Si falta, lanza para que una alerta dispare
 * antes de que un comensal vea un error.
 *
 * Uso típico: validar si un pago requiere factura electrónica o documento
 * equivalente POS (regla de 5 UVT) según `restaurant.fe_regime`.
 */
export async function getCurrentUvt(): Promise<number> {
  const year = new Date().getUTCFullYear();
  const row = await db.taxParameter.findUnique({
    where: { year },
    select: { uvt_cop: true },
  });

  if (!row) {
    throw new AppError(
      `UVT para año ${year} no cargado en tax_parameters. Contactar soporte.`,
      500,
      "UVT_NOT_LOADED"
    );
  }

  return row.uvt_cop;
}

/**
 * Umbral de 5 UVT en centavos COP. Valor crítico para decidir tipo de
 * documento DIAN (POS equivalente vs factura electrónica) cuando el
 * restaurante está en régimen de FE obligatoria.
 */
export async function getFiveUvtThresholdCents(): Promise<number> {
  const uvt = await getCurrentUvt();
  return uvt * 5 * 100;
}
