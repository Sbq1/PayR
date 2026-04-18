-- Tabla de refunds manuales + auto (v1 skeleton, v2 con wompi.refund).
--
-- Skeleton v1: el owner/manager del restaurante abre el modal en el
-- dashboard → POST /api/payment/refund crea un row con status='PENDING'.
-- Un humano procesa el refund en panel Wompi + nota crédito en Siigo,
-- y actualiza manualmente wompi_refund_id / siigo_credit_note_id.
--
-- Post-piloto (v2): endpoint llama wompi.refund y siigo.emitCreditNote
-- automáticamente, refunds.status transita PENDING → APPROVED/FAILED
-- sin intervención humana.
--
-- 3 capas anti-race (simetría con el lock optimista del orders.version):
--   1. idempotency_key (UNIQUE) — header del cliente staff bloquea
--      doble submit del mismo modal.
--   2. UNIQUE INDEX (payment_id, amount, reason_hash, date) — dedupe
--      semántico entre managers distintos del mismo restaurante que
--      registran el mismo refund el mismo día.
--   3. Lock optimista en payments.refunded_amount (migración 6) en la
--      transacción que inserta el row de refund.
--
-- reason_hash: sha256(reason) para el índice de dedupe sin indexar texto
-- largo. El texto completo queda en reason para auditoría.

CREATE TABLE "refunds" (
    "id"                   TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
    "payment_id"           TEXT NOT NULL,
    "amount_in_cents"      INTEGER NOT NULL,
    "reason"               TEXT NOT NULL,
    "reason_hash"          TEXT NOT NULL,
    "idempotency_key"      TEXT NOT NULL UNIQUE,
    "initiated_by"         TEXT NOT NULL,
    "status"               TEXT NOT NULL DEFAULT 'PENDING',
    "wompi_refund_id"      TEXT,
    "siigo_credit_note_id" TEXT,
    "error_message"        TEXT,
    "created_at"           TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at"         TIMESTAMPTZ(6)
);

CREATE INDEX "idx_refunds_payment" ON "refunds"("payment_id");
CREATE INDEX "idx_refunds_status"  ON "refunds"("status");

-- Dedupe semántico por día. Usa date trunc para que 2 managers el mismo
-- día no dupliquen un refund idéntico; al día siguiente sí se permite
-- (caso legítimo: re-abrir caso viejo).
CREATE UNIQUE INDEX "idx_refunds_dedupe"
    ON "refunds" (
        "payment_id",
        "amount_in_cents",
        "reason_hash",
        (("created_at" AT TIME ZONE 'UTC')::date)
    );

ALTER TABLE "refunds"
    ADD CONSTRAINT "refunds_amount_positive"
    CHECK ("amount_in_cents" > 0);

ALTER TABLE "refunds"
    ADD CONSTRAINT "refunds_status_check"
    CHECK ("status" IN ('PENDING', 'APPROVED', 'FAILED'));

ALTER TABLE "refunds"
    ADD CONSTRAINT "refunds_payment_id_fkey"
    FOREIGN KEY ("payment_id") REFERENCES "payments"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "refunds"
    ADD CONSTRAINT "refunds_initiated_by_fkey"
    FOREIGN KEY ("initiated_by") REFERENCES "users"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;
