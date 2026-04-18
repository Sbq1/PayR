-- Drop FK idempotency_keys.session_id → sessions.id
--
-- El campo session_id ya NO implica una sesión de comensal: es un
-- "scope" genérico para segregar idempotency keys. En Fase 2.6 los
-- endpoints staff (p.ej. /api/payment/refund) usan user.id del staff
-- JWT como scope — ese id NO existe en la tabla `sessions` (que es
-- para comensales efímeros) → FK violation.
--
-- La CASCADE que la FK proveía es reemplazada por el cron
-- expire-sessions (Fase 4) que purga idempotency_keys con expires_at
-- vencido (TTL 24h).

ALTER TABLE "idempotency_keys"
    DROP CONSTRAINT "idempotency_keys_session_id_fkey";
