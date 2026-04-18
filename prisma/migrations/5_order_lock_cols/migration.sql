-- Lock optimista sobre Order para prevenir doble cobro por race entre
-- 2 comensales escaneando el mismo QR.
--
-- version: monotonic counter. Cada `UPDATE ... WHERE version=X` consume
-- el valor y lo incrementa; el que pierde la carrera ve rowCount=0 y
-- el handler devuelve 409 ORDER_VERSION_MISMATCH.
--
-- locked_at / lock_expires_at: TTL del lock (4 min). Cubre el tiempo
-- típico del widget Wompi + margen. Un cron (Fase 4) libera locks
-- expirados solo si NOT EXISTS APPROVED payment (defiende contra
-- liberar una orden cuyo pago ya ganó).
--
-- locked_by_session_id: permite el mismo sid re-adquirir el lock
-- durante su TTL (retry legítimo), y trazabilidad de quién lo tomó.
--
-- Todas NULLABLE / DEFAULT 0: migración no destructiva, rows existentes
-- heredan version=0 y no quedan locked.

ALTER TABLE "orders"
    ADD COLUMN "version"              INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "locked_at"            TIMESTAMPTZ(6),
    ADD COLUMN "lock_expires_at"      TIMESTAMPTZ(6),
    ADD COLUMN "locked_by_session_id" TEXT;

-- Index parcial: solo las órdenes activamente locked aparecen en el
-- cron scan (típicamente <1% de las rows).
CREATE INDEX "idx_orders_lock_expires"
    ON "orders"("lock_expires_at")
    WHERE "status" = 'PAYING';

ALTER TABLE "orders"
    ADD CONSTRAINT "orders_locked_by_session_id_fkey"
    FOREIGN KEY ("locked_by_session_id") REFERENCES "sessions"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
