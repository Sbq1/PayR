-- Extender enums order_status y payment_status con REFUNDED y
-- PARTIALLY_REFUNDED. La tabla `refunds` (migración 8) referencia estos
-- valores vía transiciones, así que deben existir ANTES.
--
-- GOTCHA POSTGRES CRÍTICO: ALTER TYPE ... ADD VALUE no puede correr
-- dentro de una transacción (error: "ALTER TYPE ... ADD cannot run
-- inside a transaction block"). Prisma migrate envuelve por default
-- cada archivo en una transacción. Si mezclamos ADD VALUE con CREATE
-- TABLE en el mismo archivo, el deploy explota en producción.
--
-- Mitigación: archivo separado CON el directive que suprime el wrap
-- transaccional de Prisma. La tabla `refunds` va en el archivo 8.

-- prisma-migrate: no-transaction

ALTER TYPE "order_status"   ADD VALUE IF NOT EXISTS 'REFUNDED';
ALTER TYPE "order_status"   ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'REFUNDED';
ALTER TYPE "payment_status" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
