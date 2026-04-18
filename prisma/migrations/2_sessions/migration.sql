-- Tabla de sesiones efímeras del comensal (ámbito de mesa o recibo).
--
-- Emitida por POST /api/session/start tras escanear QR. El JWT firmado
-- (HS256, exp 2h) se devuelve al cliente; el hash sha256 del JWT se
-- persiste en `token_hash` para permitir revocación server-side sin
-- invalidar la firma (DB lookup por hash en cada request).
--
-- scope:
--   'table'   → sesión activa en la mesa, permite ver bill y pagar
--   'receipt' → emitida post-pago (scope reducido, solo ver comprobante)
--
-- expires_at: TTL de 2h desde emisión. El cron expire-sessions setea
-- revoked_at en sesiones vencidas.
--
-- Relación opcional con payments: cuando scope='receipt' apunta al
-- Payment completado (para mostrar recibo).

CREATE TABLE "sessions" (
    "id"            TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "table_id"      TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "token_hash"    TEXT NOT NULL,
    "scope"         TEXT NOT NULL DEFAULT 'table',
    "payment_id"    TEXT,
    "user_agent"    TEXT,
    "ip"            TEXT,
    "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at"    TIMESTAMPTZ(6) NOT NULL,
    "revoked_at"    TIMESTAMPTZ(6),
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- token_hash es el índice de lookup en cada request autenticada.
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- Index parcial para el cron expire-sessions (solo scan filas vivas).
CREATE INDEX "idx_sessions_expires" ON "sessions"("expires_at")
    WHERE "revoked_at" IS NULL;

-- Lookup rápido de sesiones por mesa.
CREATE INDEX "idx_sessions_table" ON "sessions"("table_id", "expires_at");

-- Foreign keys con cascada ante borrado del restaurante/mesa.
ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_table_id_fkey"
    FOREIGN KEY ("table_id") REFERENCES "tables"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_restaurant_id_fkey"
    FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- payment_id es opcional (solo set cuando scope='receipt'). SET NULL
-- si el payment se borra para no perder la sesión fantasma.
ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_payment_id_fkey"
    FOREIGN KEY ("payment_id") REFERENCES "payments"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- Validación del scope a nivel DB (defense in depth; Zod también valida).
ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_scope_check"
    CHECK ("scope" IN ('table', 'receipt'));
