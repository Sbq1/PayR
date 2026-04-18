-- Evidencia legal + documento DIAN + tracking de refund sobre Payment.
--
-- Tip (Ley 2300 — consentimiento por PAGO, no por ORDEN):
--   tip_amount / tip_percentage  — valor del intento específico
--   tip_disclaimer_accepted_at   — timestamp de aceptación explícita
--   tip_disclaimer_text_version  — versión del texto aceptado (ej.
--     'ley-2300-v1'). Sin versión no podemos probar en 2027 qué texto
--     aceptó el comensal en 2026.
--
-- DIAN (5 UVT):
--   customer_document_type/number — identificación del adquiriente
--     cuando total >= 5 UVT y restaurant.fe_regime='MANDATORY'.
--   dian_doc_type — 'POS_EQUIVALENT' (default, consumidor final) o
--     'E_INVOICE' (factura electrónica con documento identificado).
--
-- Refund:
--   refunded_amount — acumulado de refunds sobre este payment. El lock
--     optimista del endpoint de refund es:
--       UPDATE payments SET refunded_amount = refunded_amount + $x
--         WHERE id=$id
--           AND status='APPROVED'
--           AND refunded_amount + $x <= amount_in_cents
--         RETURNING *
--     rowCount=0 → 409 REFUND_EXCEEDS_PAYMENT.
--
-- Todas nullable / default: migración aditiva, rows existentes OK.
-- orders.tip_amount/tip_percentage preexistentes se mantienen como
-- snapshot del último intento (para UI); la evidencia legal vive acá.

ALTER TABLE "payments"
    ADD COLUMN "tip_amount"                  INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "tip_percentage"              NUMERIC(5,2),
    ADD COLUMN "tip_disclaimer_accepted_at"  TIMESTAMPTZ(6),
    ADD COLUMN "tip_disclaimer_text_version" TEXT,
    ADD COLUMN "customer_document_type"      TEXT,
    ADD COLUMN "customer_document_number"    TEXT,
    ADD COLUMN "dian_doc_type"               TEXT,
    ADD COLUMN "refunded_amount"             INTEGER NOT NULL DEFAULT 0;

-- Constraint defensivo: no permitir tip_disclaimer sin versión de texto.
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_tip_disclaimer_versioned"
    CHECK (
        "tip_disclaimer_accepted_at" IS NULL
        OR "tip_disclaimer_text_version" IS NOT NULL
    );

-- DIAN doc type es un enum estilo string con CHECK (enum real evitado
-- para no re-migrar cuando aparezcan más tipos — "NOTA_CREDITO" en fase
-- refund real, "NOTA_DEBITO" futuro).
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_dian_doc_type_check"
    CHECK (
        "dian_doc_type" IS NULL
        OR "dian_doc_type" IN ('POS_EQUIVALENT', 'E_INVOICE')
    );
