/**
 * Backup diario de tablas críticas a un snapshot JSON.
 *
 * Uso:
 *   npx tsx --env-file=.env.production.local scripts/backup-daily.ts > backup.json
 *
 * Sale por stdout un objeto JSON con timestamp + rows por tabla. Diseñado
 * para redirigir a archivo que después se encripta con openssl y se sube
 * como artifact de GitHub Actions (workflow backup-daily.yml).
 *
 * Defensa en profundidad contra:
 *   - DROP TABLE accidental o migración corrupta (Supabase PITR primario,
 *     este backup es secundario)
 *   - Compromise de la cuenta Supabase (backups en GitHub, encriptados)
 *
 * Scope: todas las tablas de negocio. Excluye tablas efímeras que se
 * reconstruyen (sessions, idempotency_keys) y las de tracking Prisma
 * (_prisma_migrations).
 *
 * NO sanitiza PII — la encriptación del artifact es la defensa.
 * La passphrase vive en GitHub Secret `BACKUP_PASSPHRASE` + en tu
 * password manager offline. Sin ella el backup es ruido.
 */

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const [
    restaurants,
    tables,
    qrCodes,
    users,
    orders,
    orderItems,
    payments,
    refunds,
    processedWebhooks,
    taxParameters,
    subscriptionPlans,
    authEvents,
  ] = await Promise.all([
    db.restaurant.findMany(),
    db.table.findMany(),
    db.qrCode.findMany(),
    db.user.findMany(),
    db.order.findMany(),
    db.orderItem.findMany(),
    db.payment.findMany(),
    db.refund.findMany(),
    db.processedWebhook.findMany(),
    db.taxParameter.findMany(),
    db.subscriptionPlan.findMany(),
    db.authEvent.findMany(),
  ]);

  const snapshot = {
    _meta: {
      snapshot_at: new Date().toISOString(),
      schema_version: "1.0",
      // Counts para verificación post-restore sin parsear todo.
      counts: {
        restaurants: restaurants.length,
        tables: tables.length,
        qr_codes: qrCodes.length,
        users: users.length,
        orders: orders.length,
        order_items: orderItems.length,
        payments: payments.length,
        refunds: refunds.length,
        processed_webhooks: processedWebhooks.length,
        tax_parameters: taxParameters.length,
        subscription_plans: subscriptionPlans.length,
        auth_events: authEvents.length,
      },
    },
    restaurants,
    tables,
    qr_codes: qrCodes,
    users,
    orders,
    order_items: orderItems,
    payments,
    refunds,
    processed_webhooks: processedWebhooks,
    tax_parameters: taxParameters,
    subscription_plans: subscriptionPlans,
    auth_events: authEvents,
  };

  // Replacer para serializar Decimal/BigInt/Date.
  const replacer = (_key: string, value: unknown) => {
    if (typeof value === "bigint") return value.toString();
    if (value instanceof Date) return value.toISOString();
    // Prisma Decimal serializa como objeto con toString()
    if (
      typeof value === "object" &&
      value !== null &&
      "toString" in value &&
      value.constructor?.name === "Decimal"
    ) {
      return (value as { toString: () => string }).toString();
    }
    return value;
  };

  process.stdout.write(JSON.stringify(snapshot, replacer));
  await db.$disconnect();
}

main().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
