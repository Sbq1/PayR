-- Tabla para el header HTTP Idempotency-Key.
--
-- Clave primaria compuesta (key, session_id, endpoint):
--   - key = UUID del cliente (Idempotency-Key header)
--   - session_id = scope por sesión del comensal (evita colisiones entre
--     sesiones distintas con UUIDs repetidos — improbable pero gratis)
--   - endpoint = evita colisiones si un mismo key se usa en 2 endpoints
--
-- request_hash: sha256(body canonicalizado). Si el cliente repite la key
-- con body distinto, devolvemos 409 IDEMPOTENCY_CONFLICT en vez de la
-- respuesta almacenada (seguridad contra replay con parámetros manipulados).
--
-- response_status + response_body: respuesta snapshot; se devuelve tal cual
-- si la key se repite con el mismo request_hash.
--
-- locked_at: marca cuándo se adquirió el slot; durante los primeros 30s
-- una request en curso con la misma key debe ver 409 IDEMPOTENCY_IN_FLIGHT
-- (evita race de 2 clicks simultáneos con mismo UUID).
--
-- completed_at: set cuando la response está persistida. Mientras sea NULL
-- la op está en vuelo.
--
-- expires_at: TTL 24h; cron expire-sessions (Fase 4) purga vencidos.

CREATE TABLE "idempotency_keys" (
    "key"             TEXT NOT NULL,
    "session_id"      TEXT NOT NULL,
    "endpoint"        TEXT NOT NULL,
    "request_hash"    TEXT NOT NULL,
    "response_status" INTEGER,
    "response_body"   JSONB,
    "locked_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at"    TIMESTAMPTZ(6),
    "expires_at"      TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("key", "session_id", "endpoint")
);

CREATE INDEX "idx_idempotency_expires" ON "idempotency_keys"("expires_at");

ALTER TABLE "idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
