-- Columnas para QR firmado rotable.
--
-- token_version:
--   Versión del token HMAC del QR. Empieza en 1. Se incrementa cuando
--   se rota el secret global o se invalida un QR específico. El handler
--   /api/session/start valida que la versión presentada coincide con
--   la versión vigente. Durante rotación con ventana dual (§8.5 del
--   plan), el handler acepta {current-1, current} por N días.
--
-- rotated_at:
--   Timestamp de última rotación. Informativo + alimenta reporte de
--   auditoría y permite calcular ventana de gracia.
--
-- Ambas columnas NOT NULL con DEFAULT → backfill automático en filas
-- existentes con token_version=1, rotated_at=NOW(). Compatible con
-- código actual que ignora ambas columnas.

ALTER TABLE "qr_codes"
    ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "rotated_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
