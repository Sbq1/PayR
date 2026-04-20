/**
 * E2E — /api/cron/expire-sessions
 *
 * 8 casos:
 *  1)  Order PAYING con lock stale sin payment APPROVED → liberado
 *  1b) Orphan PAYING con locks NULL + updated_at viejo → liberado
 *  1c) Orphan PAYING con locks NULL + updated_at reciente → NO liberado
 *  2)  Order PAYING con lock stale PERO con payment APPROVED → NO liberado
 *  3)  Session vencida con revoked_at NULL → revoked_at set
 *  4)  Idempotency key vencida → borrada
 *  5)  ProcessedWebhook >180d → borrado
 *  6)  ProcessedWebhook <180d → queda
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/test-cron-expire-sessions.ts
 *
 * Requiere: servidor en localhost:3000 + CRON_SECRET en .env.local.
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "node:crypto";

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

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });

  const stamp = Date.now();
  const tag = `test-expire-${stamp}`;
  const createdRefs: string[] = [];
  const eventIds: string[] = [];
  const idemKeys: string[] = [];
  const sessionIds: string[] = [];
  const orderIds: string[] = [];
  let restaurantId: string | null = null;
  let tableId: string | null = null;

  try {
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
        data: { email: `test-expire-${stamp}@test.local`, name: "Test User" },
      });
    }
    const restaurant = await db.restaurant.create({
      data: {
        name: "Test Cron Expire",
        slug: `test-cron-expire-${stamp}`,
        owner_id: owner.id,
        plan_id: plan.id,
        pos_provider: "demo",
      },
    });
    restaurantId = restaurant.id;
    const table = await db.table.create({
      data: { restaurant_id: restaurant.id, table_number: 992, status: "AVAILABLE" },
    });
    tableId = table.id;

    // Caso 1: order PAYING stale sin payment APPROVED
    const orderA = await db.order.create({
      data: {
        restaurant_id: restaurant.id,
        table_id: table.id,
        subtotal: 10000,
        total: 10000,
        status: "PAYING",
        locked_at: new Date(Date.now() - 10 * 60_000),
        lock_expires_at: new Date(Date.now() - 60_000),
      },
    });
    orderIds.push(orderA.id);

    // Caso 1b: orphan PAYING con locks NULL + updated_at viejo (legacy piloto)
    const orderAOrphan = await db.order.create({
      data: {
        restaurant_id: restaurant.id,
        table_id: table.id,
        subtotal: 10000,
        total: 10000,
        status: "PAYING",
      },
    });
    orderIds.push(orderAOrphan.id);
    await db.$executeRaw`
      UPDATE orders
         SET updated_at = NOW() - INTERVAL '40 minutes'
       WHERE id = ${orderAOrphan.id}
    `;

    // Caso 1c: orphan PAYING con locks NULL pero reciente — guard anti-liberación
    // prematura (un pago in-flight no debe ser barrido por el cron).
    const orderAFresh = await db.order.create({
      data: {
        restaurant_id: restaurant.id,
        table_id: table.id,
        subtotal: 10000,
        total: 10000,
        status: "PAYING",
      },
    });
    orderIds.push(orderAFresh.id);

    // Caso 2: order PAYING stale CON payment APPROVED
    const orderB = await db.order.create({
      data: {
        restaurant_id: restaurant.id,
        table_id: table.id,
        subtotal: 10000,
        total: 10000,
        status: "PAYING",
        locked_at: new Date(Date.now() - 10 * 60_000),
        lock_expires_at: new Date(Date.now() - 60_000),
      },
    });
    orderIds.push(orderB.id);
    const refB = `${tag}-approved-b`;
    createdRefs.push(refB);
    await db.payment.create({
      data: {
        order_id: orderB.id,
        reference: refB,
        amount_in_cents: 10000,
        status: "APPROVED",
      },
    });

    // Caso 3: session vencida
    const sessionExpired = await db.session.create({
      data: {
        restaurant_id: restaurant.id,
        table_id: table.id,
        token_hash: crypto.randomBytes(32).toString("hex"),
        expires_at: new Date(Date.now() - 60_000),
      },
    });
    sessionIds.push(sessionExpired.id);

    // Control: session NO vencida
    const sessionAlive = await db.session.create({
      data: {
        restaurant_id: restaurant.id,
        table_id: table.id,
        token_hash: crypto.randomBytes(32).toString("hex"),
        expires_at: new Date(Date.now() + 60 * 60_000),
      },
    });
    sessionIds.push(sessionAlive.id);

    // Caso 4: idempotency key vencida
    const idemKeyValue = `idem-${tag}`;
    idemKeys.push(idemKeyValue);
    await db.idempotencyKey.create({
      data: {
        key: idemKeyValue,
        session_id: "dummy",
        endpoint: "test",
        request_hash: "hash",
        expires_at: new Date(Date.now() - 60_000),
      },
    });

    // Caso 5: processed webhook viejo (>180d)
    const evOld = `${tag}:old`;
    eventIds.push(evOld);
    await db.processedWebhook.create({
      data: { event_id: evOld, event_type: "transaction.updated" },
    });
    await db.$executeRaw`
      UPDATE processed_webhooks
         SET received_at = NOW() - INTERVAL '200 days'
       WHERE event_id = ${evOld}
    `;

    // Caso 6: processed webhook nuevo (<180d)
    const evNew = `${tag}:new`;
    eventIds.push(evNew);
    await db.processedWebhook.create({
      data: { event_id: evNew, event_type: "transaction.updated" },
    });

    // --- Hit cron ---
    const res = await fetch(`${BASE_URL}/api/cron/expire-sessions`, {
      method: "GET",
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });
    const body = await res.json();
    assert(`Endpoint → 200 (got ${res.status})`, res.status === 200, JSON.stringify(body));

    // --- Verify ---
    const orderAfterA = await db.order.findUnique({ where: { id: orderA.id } });
    assert(
      "1) Lock stale SIN APPROVED → liberado (PAYING → PENDING)",
      orderAfterA?.status === "PENDING" && orderAfterA?.lock_expires_at === null
    );

    const orderAfterAOrphan = await db.order.findUnique({
      where: { id: orderAOrphan.id },
    });
    assert(
      "1b) Orphan locks=NULL + updated_at viejo → liberado",
      orderAfterAOrphan?.status === "PENDING"
    );

    const orderAfterAFresh = await db.order.findUnique({
      where: { id: orderAFresh.id },
    });
    assert(
      "1c) Orphan locks=NULL reciente → NO liberado (protege pago in-flight)",
      orderAfterAFresh?.status === "PAYING"
    );

    const orderAfterB = await db.order.findUnique({ where: { id: orderB.id } });
    assert(
      "2) Lock stale CON APPROVED → NO liberado (sigue PAYING)",
      orderAfterB?.status === "PAYING" && orderAfterB?.lock_expires_at !== null
    );

    const sessAfterExpired = await db.session.findUnique({ where: { id: sessionExpired.id } });
    assert(
      "3) Session vencida → revoked_at set",
      sessAfterExpired?.revoked_at !== null
    );

    const sessAfterAlive = await db.session.findUnique({ where: { id: sessionAlive.id } });
    assert(
      "   Session viva intacta (control)",
      sessAfterAlive?.revoked_at === null
    );

    const idemAfter = await db.idempotencyKey.findFirst({ where: { key: idemKeyValue } });
    assert("4) Idempotency vencida → borrada", idemAfter === null);

    const wOld = await db.processedWebhook.findUnique({ where: { event_id: evOld } });
    assert("5) Webhook >180d → borrado", wOld === null);

    const wNew = await db.processedWebhook.findUnique({ where: { event_id: evNew } });
    assert("6) Webhook <180d → queda", wNew !== null);
  } finally {
    if (eventIds.length) {
      await db.processedWebhook.deleteMany({ where: { event_id: { in: eventIds } } }).catch(() => {});
    }
    if (idemKeys.length) {
      await db.idempotencyKey.deleteMany({ where: { key: { in: idemKeys } } }).catch(() => {});
    }
    if (sessionIds.length) {
      await db.session.deleteMany({ where: { id: { in: sessionIds } } }).catch(() => {});
    }
    if (createdRefs.length) {
      await db.payment.deleteMany({ where: { reference: { in: createdRefs } } }).catch(() => {});
    }
    if (orderIds.length) {
      await db.order.deleteMany({ where: { id: { in: orderIds } } }).catch(() => {});
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
