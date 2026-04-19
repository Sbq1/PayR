/**
 * Setup idempotente de fixtures para smoke test de producción.
 *
 * Crea (o reutiliza) un restaurante marcado con slug `smoke-test-payr` +
 * 1 mesa + qr_code firmado + 1 order PENDING con items.
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/smoke-setup.ts
 *
 * Output JSON en stdout con los IDs/tokens que consume smoke-test.ts:
 *   { restaurantId, tableId, qrToken, qrVersion, orderId, orderVersion, slug }
 *
 * Seguridad: NUNCA llenar wompi_*_key ni siigo_* reales. El restaurante
 * de prueba queda sin credenciales → /api/payment/create cae al flow
 * DemoCheckout (publicKey="pub_test_DEMO") y no mueve dinero real.
 */

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { signQrToken } from "../lib/services/qr-token.service";

const SLUG = "smoke-test-payr";
const TABLE_NUMBER = 999;

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const db = new PrismaClient({ adapter });

  try {
    // 1. Owner: reusar primer usuario que YA posee un restaurante (válido
    //    por construcción; no creamos usuarios en prod).
    const existingRestaurant = await db.restaurant.findFirst({
      select: { owner_id: true },
      orderBy: { created_at: "asc" },
    });
    if (!existingRestaurant) {
      throw new Error(
        "No hay ningún restaurante en la DB — crear uno primero por signup"
      );
    }
    const owner = { id: existingRestaurant.owner_id };

    // 2. Plan: reusar el default/primero.
    const plan = await db.subscriptionPlan.findFirst({
      orderBy: { created_at: "asc" },
      select: { id: true },
    });
    if (!plan) {
      throw new Error(
        "No hay ningún subscription_plan — correr seed de planes primero"
      );
    }

    // 2.5 Copiar credenciales Wompi de un restaurante demo ya configurado.
    //     Sin esto, /api/payment/create falla 502 antes de llegar al
    //     idempotency/version check. Usamos el slug "showcase" que tiene
    //     keys sandbox de demo (no mueve dinero real).
    const source = await db.restaurant.findUnique({
      where: { slug: "showcase" },
      select: {
        wompi_public_key: true,
        wompi_private_key: true,
        wompi_events_secret: true,
        wompi_integrity_secret: true,
      },
    });
    if (!source?.wompi_public_key) {
      throw new Error(
        "No existe restaurante 'showcase' con Wompi configurado — setear a mano o cambiar fuente"
      );
    }

    // 3. Restaurante (upsert) con creds copiadas del demo.
    //    fe_regime=OPTIONAL para saltar la rama 5 UVT / DIAN en el happy path.
    const restaurant = await db.restaurant.upsert({
      where: { slug: SLUG },
      create: {
        slug: SLUG,
        name: "PayR Smoke Test (DO NOT USE)",
        owner_id: owner.id,
        plan_id: plan.id,
        fe_regime: "OPTIONAL",
        is_active: true,
        wompi_public_key: source.wompi_public_key,
        wompi_private_key: source.wompi_private_key,
        wompi_events_secret: source.wompi_events_secret,
        wompi_integrity_secret: source.wompi_integrity_secret,
      },
      update: {
        is_active: true,
        // Re-sincronizar las creds en cada setup (source of truth = showcase)
        wompi_public_key: source.wompi_public_key,
        wompi_private_key: source.wompi_private_key,
        wompi_events_secret: source.wompi_events_secret,
        wompi_integrity_secret: source.wompi_integrity_secret,
      },
      select: { id: true },
    });

    // 4. Mesa (unique por restaurant_id+table_number).
    const table = await db.table.upsert({
      where: {
        restaurant_id_table_number: {
          restaurant_id: restaurant.id,
          table_number: TABLE_NUMBER,
        },
      },
      create: {
        restaurant_id: restaurant.id,
        table_number: TABLE_NUMBER,
        label: "Smoke Test Table",
        is_active: true,
      },
      update: { is_active: true },
      select: { id: true },
    });

    // 5. Segunda mesa — para test de IDOR cross-table.
    const otherTable = await db.table.upsert({
      where: {
        restaurant_id_table_number: {
          restaurant_id: restaurant.id,
          table_number: TABLE_NUMBER + 1,
        },
      },
      create: {
        restaurant_id: restaurant.id,
        table_number: TABLE_NUMBER + 1,
        label: "Smoke Test Table (IDOR target)",
        is_active: true,
      },
      update: { is_active: true },
      select: { id: true },
    });

    // 6. QR code (firmado). tokenVersion=1 inicial.
    const qr = await db.qrCode.upsert({
      where: { table_id: table.id },
      create: {
        table_id: table.id,
        url: `https://smoke-test-payr.local/t/${table.id}`,
        token_version: 1,
        is_active: true,
      },
      update: { is_active: true },
      select: { token_version: true },
    });

    const qrToken = signQrToken(table.id, qr.token_version);

    // 7. Order fresco PENDING. Cada run crea uno nuevo (no reuso — los
    //    tests de idempotency/version necesitan orden virgen).
    //    Limpiamos data vieja en cascada correcta: primero payments/refunds
    //    que apuntan a orders del restaurante test, después los orders.
    //    (Los smoke tests crean payments; sin esta cascada falla con FK.)
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000);
    const staleOrderIds = (
      await db.order.findMany({
        where: {
          restaurant_id: restaurant.id,
          created_at: { lt: staleThreshold },
        },
        select: { id: true },
      })
    ).map((o) => o.id);

    if (staleOrderIds.length > 0) {
      // Refunds → payments → order_items → orders (orden según FKs).
      await db.refund.deleteMany({
        where: { payments: { order_id: { in: staleOrderIds } } },
      });
      await db.payment.deleteMany({
        where: { order_id: { in: staleOrderIds } },
      });
      await db.orderItem.deleteMany({
        where: { order_id: { in: staleOrderIds } },
      });
      await db.order.deleteMany({
        where: { id: { in: staleOrderIds } },
      });
    }

    const order = await db.order.create({
      data: {
        restaurant_id: restaurant.id,
        table_id: table.id,
        subtotal: 50000,
        tax: 9500,
        total: 59500,
        status: "PENDING",
        version: 0,
        order_items: {
          create: [
            {
              name: "Hamburguesa smoke",
              quantity: 1,
              unit_price: 30000,
              total_price: 30000,
            },
            {
              name: "Papas smoke",
              quantity: 1,
              unit_price: 20000,
              total_price: 20000,
            },
          ],
        },
      },
      select: { id: true, version: true },
    });

    const out = {
      restaurantId: restaurant.id,
      slug: SLUG,
      tableId: table.id,
      otherTableId: otherTable.id,
      qrToken,
      qrVersion: qr.token_version,
      orderId: order.id,
      orderVersion: order.version,
    };

    console.log(JSON.stringify(out, null, 2));
  } finally {
    // prisma disconnect implicit en proceso que termina
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
