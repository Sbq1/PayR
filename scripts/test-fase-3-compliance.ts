/**
 * E2E de Fase 3 — compliance (Ley 2300 + DIAN 5 UVT + fe_regime).
 *
 * Setup: crea restaurantes ad-hoc con `feRegime` distinto por caso.
 * NO toca la-barra ni el seed principal.
 *
 * Casos:
 *   [1] OPTIONAL, sobre umbral, sin doc            → 200 POS_EQUIVALENT
 *   [2] MANDATORY, bajo umbral, sin doc            → 200 POS_EQUIVALENT
 *   [3] MANDATORY, sobre umbral, sin doc           → 422 DOCUMENT_REQUIRED_5UVT
 *   [4] MANDATORY, sobre umbral, con doc           → 200 E_INVOICE, doc persistido
 *   [5] MANDATORY, bajo umbral, con doc            → 200 E_INVOICE
 *   [6] EXEMPT, sobre umbral, con doc              → 200 POS_EQUIVALENT
 *   [7] UVT no configurado                          → 503 UVT_NOT_CONFIGURED
 *   [8] Disclaimer version inválida                 → 400 Zod
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/test-fase-3-compliance.ts
 *
 * Requiere servidor en localhost:3000 (npm run dev).
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { signQrToken } from "../lib/services/qr-token.service";
import crypto from "node:crypto";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

// 5 UVT 2026 = 51.736 × 5 × 100 = 25.868.000 cents. Elegimos montos
// netos (subtotal+tax) que caen claramente por encima/debajo.
const SUBTOTAL_OVER = 25_000_000;  // +tax 4.75M = 29.75M → sobre 25.87M ✓
const SUBTOTAL_UNDER = 50_000;     // +tax 9500 = 59.5k → bajo 25.87M ✓

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
        email: `test-fase3-${Date.now()}@test.local`,
        name: "Test User",
      },
    });
  }

  const createdRestaurants: string[] = [];

  async function newRestaurant(feRegime: "MANDATORY" | "OPTIONAL" | "EXEMPT") {
    const r = await db.restaurant.create({
      data: {
        name: `Test Fase 3 ${feRegime}`,
        slug: `test-fase3-${feRegime.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        owner_id: owner!.id,
        plan_id: plan!.id,
        pos_provider: "demo",
        fe_regime: feRegime,
      },
    });
    createdRestaurants.push(r.id);
    const t = await db.table.create({
      data: {
        restaurant_id: r.id,
        table_number: 1,
        status: "AVAILABLE",
      },
    });
    await db.qrCode.create({
      data: {
        table_id: t.id,
        url: `${BASE_URL}/${r.slug}/${t.id}`,
        is_active: true,
        token_version: 1,
      },
    });
    return { restaurant: r, table: t };
  }

  async function newSession(slug: string, tableId: string) {
    const qrToken = signQrToken(tableId, 1);
    const res = await fetchJson(`${BASE_URL}/api/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, tableId, qrToken, qrVersion: 1 }),
    });
    if (res.status !== 200) {
      throw new Error(
        `session/start falló: ${res.status} ${JSON.stringify(res.body)}`
      );
    }
    return res.body as { sessionId: string; token: string };
  }

  async function newOrder(
    restaurantId: string,
    tableId: string,
    subtotal: number
  ) {
    await db.table.update({
      where: { id: tableId },
      data: { status: "AVAILABLE" },
    });
    const tax = Math.round(subtotal * 0.19);
    return db.order.create({
      data: {
        restaurant_id: restaurantId,
        table_id: tableId,
        subtotal,
        tax,
        total: subtotal + tax,
        status: "PENDING",
        version: 0,
      },
    });
  }

  function baseBody(
    orderId: string,
    slug: string,
    tableId: string,
    extra: Record<string, unknown> = {}
  ) {
    return {
      orderId,
      slug,
      tableId,
      tipAmount: 0,
      tipPercentage: 0,
      acceptedTipDisclaimer: false,
      tipDisclaimerTextVersion: "ley-2300-v1",
      expectedVersion: 0,
      ...extra,
    };
  }

  async function postPayment(
    token: string,
    body: Record<string, unknown>
  ): Promise<JsonResponse> {
    return fetchJson(`${BASE_URL}/api/payment/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    });
  }

  async function runCase(label: string, fn: () => Promise<void>) {
    console.log(`\n${label}`);
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      failed.push(`${label.split(" ")[0]} exception`);
      log("✗", `exception: ${msg.split("\n")[0]}`);
    }
  }

  try {
    // === [1] OPTIONAL, sobre umbral, sin doc → 200 POS_EQUIVALENT ===
    await runCase("[1] OPTIONAL + sobre umbral + sin doc → POS_EQUIVALENT", async () => {
      const { restaurant, table } = await newRestaurant("OPTIONAL");
      const sess = await newSession(restaurant.slug, table.id);
      const order = await newOrder(restaurant.id, table.id, SUBTOTAL_OVER);
      const r = await postPayment(
        sess.token,
        baseBody(order.id, restaurant.slug, table.id)
      );
      assert("[1] 200", r.status === 200, JSON.stringify(r.body));
      const b = r.body as { paymentId: string };
      const pmt = await db.payment.findUnique({ where: { id: b.paymentId } });
      assert(
        "[1] dian_doc_type=POS_EQUIVALENT",
        pmt?.dian_doc_type === "POS_EQUIVALENT",
        pmt?.dian_doc_type ?? "null"
      );
    });

    // === [2] MANDATORY, bajo umbral, sin doc → 200 POS_EQUIVALENT ===
    await runCase("[2] MANDATORY + bajo umbral + sin doc → POS_EQUIVALENT", async () => {
      const { restaurant, table } = await newRestaurant("MANDATORY");
      const sess = await newSession(restaurant.slug, table.id);
      const order = await newOrder(restaurant.id, table.id, SUBTOTAL_UNDER);
      const r = await postPayment(
        sess.token,
        baseBody(order.id, restaurant.slug, table.id)
      );
      assert("[2] 200", r.status === 200, JSON.stringify(r.body));
      const b = r.body as { paymentId: string };
      const pmt = await db.payment.findUnique({ where: { id: b.paymentId } });
      assert(
        "[2] dian_doc_type=POS_EQUIVALENT",
        pmt?.dian_doc_type === "POS_EQUIVALENT",
        pmt?.dian_doc_type ?? "null"
      );
    });

    // === [3] MANDATORY, sobre umbral, sin doc → 422 ===
    await runCase("[3] MANDATORY + sobre umbral + sin doc → 422", async () => {
      const { restaurant, table } = await newRestaurant("MANDATORY");
      const sess = await newSession(restaurant.slug, table.id);
      const order = await newOrder(restaurant.id, table.id, SUBTOTAL_OVER);
      const r = await postPayment(
        sess.token,
        baseBody(order.id, restaurant.slug, table.id)
      );
      assert("[3] 422", r.status === 422, `status=${r.status}: ${JSON.stringify(r.body)}`);
      const b = r.body as { code?: string };
      assert(
        "[3] code=DOCUMENT_REQUIRED_5UVT",
        b.code === "DOCUMENT_REQUIRED_5UVT",
        b.code
      );
    });

    // === [4] MANDATORY, sobre umbral, con doc → 200 E_INVOICE, doc persistido ===
    await runCase(
      "[4] MANDATORY + sobre umbral + con doc → E_INVOICE",
      async () => {
        const { restaurant, table } = await newRestaurant("MANDATORY");
        const sess = await newSession(restaurant.slug, table.id);
        const order = await newOrder(restaurant.id, table.id, SUBTOTAL_OVER);
        const r = await postPayment(
          sess.token,
          baseBody(order.id, restaurant.slug, table.id, {
            customerDocument: { type: "CC", number: "1020304050" },
          })
        );
        assert("[4] 200", r.status === 200, JSON.stringify(r.body));
        const b = r.body as { paymentId: string };
        const pmt = await db.payment.findUnique({ where: { id: b.paymentId } });
        assert(
          "[4] dian_doc_type=E_INVOICE",
          pmt?.dian_doc_type === "E_INVOICE",
          pmt?.dian_doc_type ?? "null"
        );
        assert(
          "[4] customer_document_type=CC",
          pmt?.customer_document_type === "CC"
        );
        assert(
          "[4] customer_document_number persistido",
          pmt?.customer_document_number === "1020304050"
        );
      }
    );

    // === [5] MANDATORY, bajo umbral, con doc → 200 E_INVOICE ===
    await runCase(
      "[5] MANDATORY + bajo umbral + con doc → E_INVOICE",
      async () => {
        const { restaurant, table } = await newRestaurant("MANDATORY");
        const sess = await newSession(restaurant.slug, table.id);
        const order = await newOrder(restaurant.id, table.id, SUBTOTAL_UNDER);
        const r = await postPayment(
          sess.token,
          baseBody(order.id, restaurant.slug, table.id, {
            customerDocument: { type: "NIT", number: "900123456-7" },
          })
        );
        assert("[5] 200", r.status === 200, JSON.stringify(r.body));
        const b = r.body as { paymentId: string };
        const pmt = await db.payment.findUnique({ where: { id: b.paymentId } });
        assert(
          "[5] dian_doc_type=E_INVOICE (FE por solicitud explícita)",
          pmt?.dian_doc_type === "E_INVOICE",
          pmt?.dian_doc_type ?? "null"
        );
      }
    );

    // === [6] EXEMPT, sobre umbral, con doc → 200 POS_EQUIVALENT ===
    await runCase("[6] EXEMPT + sobre umbral + con doc → POS_EQUIVALENT", async () => {
      const { restaurant, table } = await newRestaurant("EXEMPT");
      const sess = await newSession(restaurant.slug, table.id);
      const order = await newOrder(restaurant.id, table.id, SUBTOTAL_OVER);
      const r = await postPayment(
        sess.token,
        baseBody(order.id, restaurant.slug, table.id, {
          customerDocument: { type: "CC", number: "1020304050" },
        })
      );
      assert("[6] 200", r.status === 200, JSON.stringify(r.body));
      const b = r.body as { paymentId: string };
      const pmt = await db.payment.findUnique({ where: { id: b.paymentId } });
      assert(
        "[6] dian_doc_type=POS_EQUIVALENT (EXEMPT nunca emite FE)",
        pmt?.dian_doc_type === "POS_EQUIVALENT",
        pmt?.dian_doc_type ?? "null"
      );
    });

    // === [7] UVT no configurado → 503 ===
    await runCase("[7] UVT no configurado → 503 UVT_NOT_CONFIGURED", async () => {
      const year = new Date().getUTCFullYear();
      const savedUvt = await db.taxParameter.findUnique({ where: { year } });
      if (!savedUvt) {
        log("!", "saltado: no hay fila UVT del año actual para borrar");
        return;
      }

      await db.taxParameter.delete({ where: { year } });
      try {
        const { restaurant, table } = await newRestaurant("MANDATORY");
        const sess = await newSession(restaurant.slug, table.id);
        const order = await newOrder(restaurant.id, table.id, SUBTOTAL_OVER);
        // El bill.service lazy-lookup el UVT solo si MANDATORY, así que
        // pegarle directo a /api/payment/create para forzar el lookup.
        const r = await postPayment(
          sess.token,
          baseBody(order.id, restaurant.slug, table.id, {
            customerDocument: { type: "CC", number: "1020304050" },
          })
        );
        assert("[7] 503", r.status === 503, `status=${r.status}: ${JSON.stringify(r.body)}`);
        const b = r.body as { code?: string };
        assert(
          "[7] code=UVT_NOT_CONFIGURED",
          b.code === "UVT_NOT_CONFIGURED",
          b.code
        );
      } finally {
        await db.taxParameter.create({
          data: {
            year: savedUvt.year,
            uvt_cop: savedUvt.uvt_cop,
            source_resolution: savedUvt.source_resolution,
          },
        });
      }
    });

    // === [8] Disclaimer version inválida → 400 Zod ===
    await runCase("[8] Disclaimer version inválida → 400 Zod", async () => {
      const { restaurant, table } = await newRestaurant("OPTIONAL");
      const sess = await newSession(restaurant.slug, table.id);
      const order = await newOrder(restaurant.id, table.id, SUBTOTAL_UNDER);
      const r = await postPayment(
        sess.token,
        baseBody(order.id, restaurant.slug, table.id, {
          tipDisclaimerTextVersion: "ley-2300-fake-v99",
        })
      );
      assert("[8] 400 (Zod)", r.status === 400, JSON.stringify(r.body));
    });
  } finally {
    console.log("\nCleanup");
    try {
      if (createdRestaurants.length > 0) {
        await db.payment.deleteMany({
          where: { orders: { restaurant_id: { in: createdRestaurants } } },
        });
        await db.order.deleteMany({
          where: { restaurant_id: { in: createdRestaurants } },
        });
        await db.session.deleteMany({
          where: { restaurant_id: { in: createdRestaurants } },
        });
        // tables + qr cascade on restaurant delete
        await db.restaurant.deleteMany({
          where: { id: { in: createdRestaurants } },
        });
      }
      log("✓", `${createdRestaurants.length} restaurantes de prueba eliminados`);
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
    failed.forEach((f) => console.log(`    ✗ ${f}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\nError fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
