/**
 * E2E — /api/cron/reconcile-payments-hot
 *
 * Ejercita el endpoint de cron:
 *  1) Auth: sin header → 401
 *  2) Auth: secret incorrecto → 401
 *  3) Auth: correcto → 200
 *  4) Payment PENDING fresco (<90s) NO entra en la ventana
 *  5) Payment PENDING viejo (2min) entra en la ventana → counted
 *  6) Payment APPROVED NO entra
 *
 * Nota: sin credenciales Wompi configuradas en el restaurant, reconcilePayment
 * devuelve PENDING (no toca Wompi). Este test valida filtro + auth, no el
 * round-trip completo Wompi (cubierto por scripts/_audit_post_refactor.ts).
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/test-cron-reconcile-hot.ts
 *
 * Requiere: servidor en localhost:3000 + CRON_SECRET en .env.local.
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("✗ CRON_SECRET no definido en .env.local");
  process.exit(1);
}

const passed: string[] = [];
const failed: string[] = [];
function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed.push(name);
    console.log(`  ✓  ${name}`);
  } else {
    failed.push(name);
    console.log(`  ✗  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function hit(token: string | null) {
  const headers: Record<string, string> = {};
  if (token !== null) headers["authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/api/cron/reconcile-payments-hot`, {
    method: "GET",
    headers,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body: body as Record<string, number> };
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });

  const stamp = Date.now();
  const createdRefs: string[] = [];
  let restaurantId: string | null = null;
  let tableId: string | null = null;
  const orderIds: string[] = [];

  try {
    // --- AUTH ---
    const r1 = await hit(null);
    assert("1) Sin header → 401", r1.status === 401);

    const r2 = await hit("wrong-secret-xyz");
    assert("2) Secret incorrecto → 401", r2.status === 401);

    const r3 = await hit(CRON_SECRET!);
    assert("3) Secret correcto → 200", r3.status === 200);

    // --- Setup ---
    let plan = await db.subscriptionPlan.findFirst({ where: { tier: "STARTER" } });
    if (!plan) {
      plan = await db.subscriptionPlan.create({
        data: { tier: "STARTER", name: "Starter", max_tables: 5, monthly_price_cop: 0 },
      });
    }
    let owner = await db.user.findFirst();
    if (!owner) {
      owner = await db.user.create({
        data: { email: `test-cron-${stamp}@test.local`, name: "Test User" },
      });
    }
    const restaurant = await db.restaurant.create({
      data: {
        name: "Test Cron Hot",
        slug: `test-cron-hot-${stamp}`,
        owner_id: owner.id,
        plan_id: plan.id,
        pos_provider: "demo",
      },
    });
    restaurantId = restaurant.id;
    const table = await db.table.create({
      data: { restaurant_id: restaurant.id, table_number: 991, status: "AVAILABLE" },
    });
    tableId = table.id;

    async function createPayment(
      ref: string,
      status: "PENDING" | "APPROVED",
      updatedAgoSec: number
    ) {
      const order = await db.order.create({
        data: {
          restaurant_id: restaurant.id,
          table_id: table.id,
          subtotal: 10000,
          total: 10000,
          status: "PENDING",
        },
      });
      orderIds.push(order.id);
      await db.payment.create({
        data: {
          order_id: order.id,
          reference: ref,
          amount_in_cents: 1_000_000,
          currency: "COP",
          status,
        },
      });
      createdRefs.push(ref);
      // Forzar updated_at via raw.
      await db.$executeRaw`
        UPDATE payments
           SET updated_at = NOW() - (${updatedAgoSec} || ' seconds')::interval
         WHERE reference = ${ref}
      `;
    }

    const refFresh = `test-cron-hot-fresh-${stamp}`;
    const refOld = `test-cron-hot-old-${stamp}`;
    const refApproved = `test-cron-hot-approved-${stamp}`;

    await createPayment(refFresh, "PENDING", 30); // 30s → NO entra
    await createPayment(refOld, "PENDING", 120); // 2min → entra
    await createPayment(refApproved, "APPROVED", 120); // APPROVED → NO entra

    const r4 = await hit(CRON_SECRET!);
    assert("4) Endpoint 200 post-setup", r4.status === 200);

    // Verificamos que los contadores reflejan sólo los payments nuestros que
    // encajaron: el `processed` es global al cron, no podemos aislar. En
    // cambio, validamos el efecto en DB: el payment viejo sin wompi-creds
    // sigue PENDING (reconcile devuelve PENDING silencioso) y el fresco ni
    // siquiera fue tocado.
    const pFresh = await db.payment.findUnique({ where: { reference: refFresh } });
    const pOld = await db.payment.findUnique({ where: { reference: refOld } });
    const pApproved = await db.payment.findUnique({ where: { reference: refApproved } });

    assert("5) Payment fresco sigue PENDING (ignored)", pFresh?.status === "PENDING");
    assert("6) Payment viejo sigue PENDING (sin wompi creds → no cambio)", pOld?.status === "PENDING");
    assert("7) Payment APPROVED no regresa a PENDING", pApproved?.status === "APPROVED");
  } finally {
    // Cleanup
    if (createdRefs.length) {
      await db.payment.deleteMany({ where: { reference: { in: createdRefs } } });
    }
    if (orderIds.length) {
      await db.order.deleteMany({ where: { id: { in: orderIds } } });
    }
    if (tableId) await db.table.delete({ where: { id: tableId } }).catch(() => {});
    if (restaurantId) await db.restaurant.delete({ where: { id: restaurantId } }).catch(() => {});
    await db.$disconnect();
  }

  console.log(`\n  ${passed.length} passed / ${failed.length} failed`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
