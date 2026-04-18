-- Tabla de parámetros tributarios DIAN actualizables por año.
-- Fuente de verdad para UVT (Unidad de Valor Tributario) que se usa en
-- la lógica del 5 UVT para determinar si un pago requiere factura
-- electrónica o documento equivalente POS.
--
-- El UVT se actualiza por Resolución DIAN anual (típicamente en diciembre).
-- Una env var desactualizada genera rechazos silenciosos de pagos válidos
-- o emisión de docs incorrectos — por eso esto vive en DB, no en env.
--
-- TODO: script anual `scripts/seed-tax-parameters.ts` inserta el año siguiente
-- antes del 1 de enero. Alerta crítica si `getCurrentUvt()` no encuentra el año.

CREATE TABLE "tax_parameters" (
    "year"              INTEGER NOT NULL,
    "uvt_cop"           INTEGER NOT NULL,
    "source_resolution" TEXT,
    "created_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tax_parameters_pkey" PRIMARY KEY ("year")
);

-- Seed inicial: UVT 2026 = $51.736 COP
-- Fuente: DIAN Resolución 193 de 2024
INSERT INTO "tax_parameters" ("year", "uvt_cop", "source_resolution")
VALUES (2026, 51736, 'DIAN Res. 193/2024');
