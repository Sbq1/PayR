/**
 * Audit E2E — post-refactor commit a8dd584 + fix A1.
 *
 * Ejercita el flow de createPayment modificado:
 *   - Happy path (no retry)
 *   - Reuse path (sameSess + Wompi null + reciente + amount match)
 *   - No reuse (tooOld / otra sess / amount drift)
 *   - 2 requests simultáneos con misma idem-key
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/_audit_post_refactor.ts
 *
 * Requiere: servidor corriendo en localhost:3000 (npm run dev).
 * Setup limpio: datos con prefijo `test-audit-*` que se borran al final.
 *
 * Nota: /api/payment/create rate-limita 5/sess/min. Cada test case usa su
 * propia session fresca vía /api/session/start para no consumir cuota.
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { signQrToken } from "../lib/services/qr-token.service";
import crypto from "node:crypto";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

type JsonResponse = { status: number; body: unknown };

async function fetchJson(url: string, init?: RequestInit): Promise<JsonResponse> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`No se pudo conectar a ${url}: ${msg}`);
  }
  const text = await res.text();
  try {
    return { status: res.status, body: text ? JSON.parse(text) : {} };
  } catch {
    throw new Error(
      `Respuesta no-JSON de ${url} (status ${res.status}): ${text.slice(0, 120)}`
    );
  }
}

const passed: string[] = [];
const failed: string[] = [];

function log(icon: string, msg: string) {
  console.log(`  ${icon}  ${msg}`);
}

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed.push(name);
    log("✓", name);
  } else {
    failed.push(name);
    log("✗", `${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });

  // --- Setup común ---
  let plan = await db.subscriptionPlan.findFirst({ where: { tier: "STARTER" } });
  if (!plan) {
    plan = await db.subscriptionPlan.create({
      data: {
        tier: "STARTER",
        name: "Starter",
        max_tables: 5,
        monthly_price_cop: 0,
      },
    });
  }

  let owner = await db.user.findFirst();
  if (!owner) {
    owner = await db.user.create({
      data: {
        email: `test-audit-${Date.now()}@test.local`,
        name: "Test User",
      },
    });
  }

  const restaurant = await db.restaurant.create({
    data: {
      name: "Test Audit Restaurant",
      slug: `test-audit-${Date.now()}`,
      owner_id: owner.id,
      plan_id: plan.id,
      pos_provider: "demo",
    },
  });

  const table = await db.table.create({
    data: {
      restaurant_id: restaurant.id,
      table_number: 888,
      status: "AVAILABLE",
    },
  });

  const qr = await db.qrCode.create({
    data: {
      table_id: table.id,
      url: `${BASE_URL}/${restaurant.slug}/${table.id}`,
      is_active: true,
      token_version: 1,
    },
  });

  async function newSession() {
    const qrToken = signQrToken(table.id, 1);
    const res = await fetchJson(`${BASE_URL}/api/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: restaurant.slug,
        tableId: table.id,
        qrToken,
        qrVersion: 1,
      }),
    });
    if (res.status !== 200) {
      throw new Error(
        `session/start falló: ${res.status} ${JSON.stringify(res.body)}`
      );
    }
    return res.body as { sessionId: string; token: string };
  }

  async function postPayment(
    token: string,
    body: Record<string, unknown>,
    idemKey?: string
  ): Promise<JsonResponse> {
    return fetchJson(`${BASE_URL}/api/payment/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": idemKey ?? crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    });
  }

  async function freshOrder(subtotal = 50_000) {
    await db.table.update({
      where: { id: table.id },
      data: { status: "AVAILABLE" },
    });
    const tax = Math.round(subtotal * 0.19);
    return db.order.create({
      data: {
        restaurant_id: restaurant.id,
        table_id: table.id,
        subtotal,
        tax,
        total: subtotal + tax,
        status: "PENDING",
        version: 0,
      },
    });
  }

  async function cleanupOrder(orderId: string) {
    await db.payment.deleteMany({ where: { order_id: orderId } });
    await db.order.delete({ where: { id: orderId } });
  }

  function baseBody(orderId: string, extra: Record<string, unknown> = {}) {
    return {
      orderId,
      slug: restaurant.slug,
      tableId: table.id,
      tipAmount: 0,
      tipPercentage: 0,
      acceptedTipDisclaimer: false,
      tipDisclaimerTextVersion: "ley-2300-v1",
      expectedVersion: 0,
      ...extra,
    };
  }

  async function runCase(label: string, fn: () => Promise<void>) {
    console.log(`\n${label}`);
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const name = `${label.split(" ")[0]} exception`;
      failed.push(name);
      log("✗", `${name} — ${msg.split("\n")[0]}`);
    }
  }

  try {
    // === [1] Happy path ===
    await runCase("[1] Happy path — primer Payment", async () => {
      const sess = await newSession();
      const order = await freshOrder();
      try {
        const res = await postPayment(sess.token, baseBody(order.id));
        assert("[1] 200", res.status === 200, JSON.stringify(res.body));
        const body = res.body as {
          paymentId?: string;
          orderVersion?: number;
        };
        assert("[1] paymentId retornado", !!body.paymentId);
        assert("[1] orderVersion=1", body.orderVersion === 1);

        const updated = await db.order.findUnique({ where: { id: order.id } });
        assert("[1] order.status=PAYING", updated?.status === "PAYING");
        assert("[1] version=1 en DB", updated?.version === 1);
        assert(
          "[1] locked_by_session_id=sess",
          updated?.locked_by_session_id === sess.sessionId
        );

        const payments = await db.payment.findMany({
          where: { order_id: order.id },
        });
        assert("[1] 1 Payment en DB", payments.length === 1);
      } finally {
        await cleanupOrder(order.id);
      }
    });

    // === [2] Reuse: sameSess + Wompi null + reciente + amount match ===
    await runCase(
      "[2] Reuse — 2do call misma sess devuelve mismo paymentId",
      async () => {
        const sess = await newSession();
        const order = await freshOrder();
        try {
          const r1 = await postPayment(sess.token, baseBody(order.id));
          assert("[2] 1er call 200", r1.status === 200, JSON.stringify(r1.body));
          const b1 = r1.body as { paymentId: string; reference: string };

          const r2 = await postPayment(
            sess.token,
            baseBody(order.id, { expectedVersion: 1 })
          );
          assert("[2] 2do call 200", r2.status === 200, JSON.stringify(r2.body));
          const b2 = r2.body as { paymentId: string; reference: string };

          assert(
            "[2] mismo paymentId (reuse)",
            b2.paymentId === b1.paymentId,
            `${b1.paymentId?.slice(-8)} vs ${b2.paymentId?.slice(-8)}`
          );
          assert("[2] misma reference", b2.reference === b1.reference);

          const payments = await db.payment.findMany({
            where: { order_id: order.id },
          });
          assert(
            "[2] 1 Payment en DB (no duplicado)",
            payments.length === 1,
            `count=${payments.length}`
          );
        } finally {
          await cleanupOrder(order.id);
        }
      }
    );

    // === [3] Too old (>8min) → no reuse ===
    await runCase(
      "[3] Too old — Payment > 8min → ERROR + nuevo",
      async () => {
        const sess = await newSession();
        const order = await freshOrder();
        try {
          const r1 = await postPayment(sess.token, baseBody(order.id));
          assert("[3] 1er call 200", r1.status === 200, JSON.stringify(r1.body));
          const b1 = r1.body as { paymentId: string };

          await db.payment.update({
            where: { id: b1.paymentId },
            data: { created_at: new Date(Date.now() - 10 * 60 * 1000) },
          });

          const r2 = await postPayment(
            sess.token,
            baseBody(order.id, { expectedVersion: 1 })
          );
          assert("[3] 2do call 200", r2.status === 200, JSON.stringify(r2.body));
          const b2 = r2.body as { paymentId: string };
          assert(
            "[3] nuevo paymentId (no reuse)",
            b2.paymentId !== b1.paymentId
          );

          const oldPayment = await db.payment.findUnique({
            where: { id: b1.paymentId },
          });
          assert(
            "[3] viejo Payment status=ERROR",
            oldPayment?.status === "ERROR",
            `actual=${oldPayment?.status}`
          );

          const payments = await db.payment.findMany({
            where: { order_id: order.id },
          });
          assert("[3] 2 Payments en DB", payments.length === 2);
        } finally {
          await cleanupOrder(order.id);
        }
      }
    );

    // === [4] Otra sess toma lock activo → 409 ===
    await runCase(
      "[4] Otra sess con lock activo → 409 ORDER_VERSION_MISMATCH",
      async () => {
        const sessA = await newSession();
        const sessB = await newSession();
        const order = await freshOrder();
        try {
          const r1 = await postPayment(sessA.token, baseBody(order.id));
          assert(
            "[4] sessA 1er call 200",
            r1.status === 200,
            JSON.stringify(r1.body)
          );

          const r2 = await postPayment(
            sessB.token,
            baseBody(order.id, { expectedVersion: 1 })
          );
          assert(
            "[4] sessB recibe 409",
            r2.status === 409,
            JSON.stringify(r2.body)
          );
          const b2 = r2.body as { code?: string };
          assert(
            "[4] code=ORDER_VERSION_MISMATCH",
            b2.code === "ORDER_VERSION_MISMATCH",
            `code=${b2.code}`
          );
        } finally {
          await cleanupOrder(order.id);
        }
      }
    );

    // === [5] Orden ya PAID → throw 'ya fue pagada' ===
    await runCase(
      "[5] Orden ya APPROVED+PAID → throw 'ya fue pagada'",
      async () => {
        const sess = await newSession();
        const order = await freshOrder();
        try {
          const r1 = await postPayment(sess.token, baseBody(order.id));
          assert("[5] 1er call 200", r1.status === 200, JSON.stringify(r1.body));
          const b1 = r1.body as { paymentId: string };

          await db.payment.update({
            where: { id: b1.paymentId },
            data: { status: "APPROVED" },
          });
          await db.order.update({
            where: { id: order.id },
            data: { status: "PAID" },
          });

          const r2 = await postPayment(
            sess.token,
            baseBody(order.id, { expectedVersion: 1 })
          );
          assert(
            "[5] 2do call 502 (PaymentError)",
            r2.status === 502,
            `status=${r2.status}: ${JSON.stringify(r2.body)}`
          );
          const b2 = r2.body as { error?: string };
          assert(
            "[5] mensaje contiene 'ya fue pagada'",
            (b2.error ?? "").toLowerCase().includes("ya fue pagada"),
            b2.error
          );
        } finally {
          await cleanupOrder(order.id);
        }
      }
    );

    // === [6] Concurrent misma idem-key → 1 OK + 1 IN_FLIGHT/replay ===
    await runCase(
      "[6] Concurrent misma idem-key → 1 OK + 1 IN_FLIGHT/replay",
      async () => {
        const sess = await newSession();
        const order = await freshOrder();
        try {
          const idemKey = crypto.randomUUID();
          const body = baseBody(order.id);

          const [rA, rB] = await Promise.all([
            postPayment(sess.token, body, idemKey),
            postPayment(sess.token, body, idemKey),
          ]);

          const statuses = [rA.status, rB.status].sort();
          const atLeastOne200 = statuses.includes(200);
          const validCombo =
            (statuses[0] === 200 && statuses[1] === 200) ||
            (statuses[0] === 200 && statuses[1] === 409);

          assert(
            "[6] al menos una 200",
            atLeastOne200,
            JSON.stringify(statuses)
          );
          assert(
            "[6] combinación válida (200+200 ó 200+409)",
            validCombo,
            JSON.stringify({ a: rA.body, b: rB.body })
          );

          const payments = await db.payment.findMany({
            where: { order_id: order.id },
          });
          assert(
            "[6] 1 Payment en DB (no duplicado por concurrencia)",
            payments.length === 1,
            `count=${payments.length}`
          );
        } finally {
          await cleanupOrder(order.id);
        }
      }
    );

    // === [7] Amount mismatch (fix A1) → no reuse ===
    await runCase(
      "[7] Amount mismatch — POS sync mid-flow → no reuse",
      async () => {
        const sess = await newSession();
        const order = await freshOrder(50_000);
        try {
          const r1 = await postPayment(sess.token, baseBody(order.id));
          assert("[7] 1er call 200", r1.status === 200, JSON.stringify(r1.body));
          const b1 = r1.body as { paymentId: string };

          // Simular POS sync: order.subtotal sube sin cambiar version.
          const newSubtotal = 70_000;
          const newTax = Math.round(newSubtotal * 0.19);
          await db.order.update({
            where: { id: order.id },
            data: {
              subtotal: newSubtotal,
              tax: newTax,
              total: newSubtotal + newTax,
            },
          });

          const r2 = await postPayment(
            sess.token,
            baseBody(order.id, { expectedVersion: 1 })
          );
          assert("[7] 2do call 200", r2.status === 200, JSON.stringify(r2.body));
          const b2 = r2.body as { paymentId: string };
          assert(
            "[7] nuevo paymentId (no reuse por amount drift)",
            b2.paymentId !== b1.paymentId,
            `reuse detectado: ${b1.paymentId}`
          );

          const oldPayment = await db.payment.findUnique({
            where: { id: b1.paymentId },
          });
          assert(
            "[7] viejo Payment status=ERROR",
            oldPayment?.status === "ERROR",
            `actual=${oldPayment?.status}`
          );

          const newPayment = await db.payment.findUnique({
            where: { id: b2.paymentId },
          });
          assert(
            "[7] nuevo Payment amount = currentTotal",
            Number(newPayment?.amount_in_cents) === newSubtotal + newTax,
            `actual=${newPayment?.amount_in_cents} expected=${newSubtotal + newTax}`
          );
        } finally {
          await cleanupOrder(order.id);
        }
      }
    );
  } finally {
    // --- Cleanup global ---
    console.log("\nCleanup");
    try {
      await db.payment.deleteMany({
        where: { orders: { restaurant_id: restaurant.id } },
      });
      await db.order.deleteMany({ where: { restaurant_id: restaurant.id } });
      await db.session.deleteMany({ where: { restaurant_id: restaurant.id } });
      await db.idempotencyKey.deleteMany({
        where: { session_id: { in: [] } }, // FK cascade por session delete
      });
      await db.qrCode.delete({ where: { id: qr.id } });
      await db.table.delete({ where: { id: table.id } });
      await db.restaurant.delete({ where: { id: restaurant.id } });
      log("✓", "datos de prueba eliminados");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log("⚠", `cleanup parcial: ${msg.split("\n")[0]}`);
    }
    await db.$disconnect();
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`  Resultado: ${passed.length} passed, ${failed.length} failed`);
  console.log("═══════════════════════════════════════\n");

  if (failed.length > 0) {
    console.log("  Fallaron:");
    failed.forEach((f) => console.log(`    ✗ ${f}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\nError fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
