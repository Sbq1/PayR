-- Régimen de Factura Electrónica DIAN del restaurante.
--
-- fe_regime determina la lógica del umbral de 5 UVT:
--   - MANDATORY: total >= 5 UVT exige customer_document → dian_doc_type='E_INVOICE'
--   - OPTIONAL:  documento equivalente POS siempre; FE solo bajo solicitud
--   - EXEMPT:    no emite FE bajo ningún monto
--
-- Default 'OPTIONAL' para rows existentes — los restaurantes piloto
-- deben configurar explícitamente MANDATORY si corresponde a su
-- régimen tributario. Validar con tributarista antes de producción.
--
-- CREATE TYPE corre transaccional sin problema (el gotcha
-- `no-transaction` solo aplica a ALTER TYPE ADD VALUE extendiendo
-- enums existentes).

CREATE TYPE "fe_regime" AS ENUM ('MANDATORY', 'OPTIONAL', 'EXEMPT');

ALTER TABLE "restaurants"
    ADD COLUMN "fe_regime" "fe_regime" NOT NULL DEFAULT 'OPTIONAL';
