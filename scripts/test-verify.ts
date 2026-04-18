/**
 * Script de prueba para el flujo de verificación de pagos.
 *
 * Pruebas:
 *   1. Crypto: encrypt/decrypt roundtrip
 *   2. DB: crea restaurante + mesa + orden + payment PENDING de prueba
 *   3. Verify endpoint: llama POST /api/payment/verify y valida que no crashee
 *   4. Cleanup: borra los datos de prueba
 *
 * Uso:
 *   npx tsx scripts/test-verify.ts
 *
 * Requiere: servidor corriendo en localhost:3000 (npm run dev)
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { encrypt, decrypt } from "../lib/utils/crypto";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { signQrToken } from "../lib/services/qr-token.service";

// Usa el dev server local por default. NO leer NEXT_PUBLIC_APP_URL — ese
// apunta a producción y el test escribe data con prefijo TEST-VERIFY-*
// que no queremos ensuciar en prod. Override explícito con TEST_BASE_URL.
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

/**
 * fetch con mensaje útil ante los 2 modos de falla típicos:
 *  - network error (servidor caído) → Node fetch lanza antes del response
 *  - HTML 404 (URL equivocada) → response OK pero JSON.parse explota
 */
async function fetchJson(
  url: string,
  init?: RequestInit
): Promise<{ status: number; body: unknown }> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `No se pudo conectar a ${url}.\n` +
        `  ¿Tenés "npm run dev" corriendo en ${BASE_URL}?\n` +
        `  (Para apuntar a otro host, setear TEST_BASE_URL.)\n` +
        `  Detalle: ${msg}`
    );
  }
  const text = await res.text();
  try {
    return { status: res.status, body: text ? JSON.parse(text) : {} };
  } catch {
    throw new Error(
      `Respuesta no-JSON de ${url} (status ${res.status}).\n` +
        `  ¿${BASE_URL} tiene Fase 1 deployada?\n` +
        `  Primeros 80 chars: ${text.slice(0, 80).replace(/\n/g, " ")}`
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

// --- Test 1: Crypto roundtrip ---
function testCrypto() {
  console.log("\n[1/4] Crypto encrypt/decrypt roundtrip");

  try {
    const original = "prv_test_abc123_secret_key";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    assert("encrypt produce formato iv:data:tag", encrypted.split(":").length === 3);
    assert("decrypt recupera el valor original", decrypted === original);

    // Simular el bug: decrypt de texto plano debe fallar
    try {
      decrypt("texto-plano-sin-formato");
      assert("decrypt de texto plano lanza error", false, "no lanzó error");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      assert(
        "decrypt de texto plano lanza error",
        msg === "Invalid encrypted text format"
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    assert("crypto funciona", false, msg);
  }
}

// --- Test 2-4: DB + Verify endpoint ---
async function testVerifyFlow() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });

  const testRef = `TEST-VERIFY-${Date.now()}`;
  let restaurantId = "";
  let tableId = "";
  let qrCodeId = "";
  let orderId = "";
  let paymentId = "";
  let planId = "";

  try {
    // --- Test 2: Setup datos de prueba ---
    console.log("\n[2/4] Crear datos de prueba en BD");

    // Buscar o crear plan
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
      planId = plan.id;
    }

    // Buscar un owner existente o crear uno temporal
    let owner = await db.user.findFirst();
    if (!owner) {
      owner = await db.user.create({
        data: {
          email: `test-verify-${Date.now()}@test.local`,
          name: "Test User",
        },
      });
    }

    // Crear restaurante demo (sin credenciales Wompi → verify retorna status actual)
    const restaurant = await db.restaurant.create({
      data: {
        name: "Test Verify Restaurant",
        slug: `test-verify-${Date.now()}`,
        owner_id: owner.id,
        plan_id: plan.id,
        pos_provider: "demo",
      },
    });
    restaurantId = restaurant.id;

    const table = await db.table.create({
      data: {
        restaurant_id: restaurantId,
        table_number: 999,
        status: "PAYING",
      },
    });
    tableId = table.id;

    // QR code asociado al table (requerido por /api/session/start desde Fase 1).
    const qr = await db.qrCode.create({
      data: {
        table_id: tableId,
        url: `${BASE_URL}/${restaurant.slug}/${tableId}`,
        is_active: true,
        token_version: 1,
      },
    });
    qrCodeId = qr.id;

    const order = await db.order.create({
      data: {
        restaurant_id: restaurantId,
        table_id: tableId,
        subtotal: 50000,
        tax: 9500,
        total: 59500,
        status: "PAYING",
      },
    });
    orderId = order.id;

    const payment = await db.payment.create({
      data: {
        order_id: orderId,
        reference: testRef,
        amount_in_cents: 59500,
        currency: "COP",
        status: "PENDING",
      },
    });
    paymentId = payment.id;

    assert("datos de prueba creados", true);
    log("→", `reference: ${testRef}`);

    // --- Auth setup: /api/payment/verify requiere Bearer desde Fase 1. ---
    // Obtener JWT vía session/start con el QR recién creado.
    console.log("\n[3/5] Crear sesión del comensal vía /api/session/start");
    const qrToken = signQrToken(tableId, 1);
    const sessionRes = await fetchJson(`${BASE_URL}/api/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: restaurant.slug,
        tableId,
        qrToken,
        qrVersion: 1,
      }),
    });
    const sessionBody = sessionRes.body as { token?: string; error?: string };
    assert(
      "session/start responde 200",
      sessionRes.status === 200,
      sessionBody?.error ?? `status ${sessionRes.status}`
    );
    const bearer = sessionBody?.token;
    assert(
      "session/start retorna JWT válido (3 partes)",
      typeof bearer === "string" && bearer.split(".").length === 3
    );

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
    };

    // --- Test 4: Verify endpoint con Bearer ---
    console.log("\n[4/5] Llamar POST /api/payment/verify (con Bearer)");

    try {
      const res = await fetch(`${BASE_URL}/api/payment/verify`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ reference: testRef }),
      });

      const data = await res.json();

      assert("verify responde 200", res.status === 200, JSON.stringify(data));
      assert(
        "verify no crashea con 'Invalid encrypted text'",
        !data.error?.includes("encrypted"),
        data.error
      );
      assert(
        "verify retorna status PENDING (demo sin Wompi keys)",
        data.status === "PENDING",
        `status: ${data.status}`
      );

      log("→", `response: ${JSON.stringify(data)}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      assert("verify endpoint accesible", false, `servidor corriendo en ${BASE_URL}? — ${msg}`);
    }

    // --- Test 4b: Verify con referencia inexistente (auth OK, ownership miss) ---
    console.log("\n[4b] Verify con referencia inexistente");
    try {
      const res = await fetch(`${BASE_URL}/api/payment/verify`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ reference: "REF-NO-EXISTE-999" }),
      });
      assert("referencia inexistente retorna 404", res.status === 404);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      assert("verify ref inexistente", false, msg);
    }

    // --- Test 4c: Verify sin body ---
    console.log("\n[4c] Verify sin reference");
    try {
      const res = await fetch(`${BASE_URL}/api/payment/verify`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({}),
      });
      assert("sin reference retorna 400", res.status === 400);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      assert("verify sin body", false, msg);
    }

    // --- Test 4d: Verify sin Bearer → 401 SESSION_MISSING ---
    console.log("\n[4d] Verify sin Bearer retorna 401");
    try {
      const res = await fetch(`${BASE_URL}/api/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: testRef }),
      });
      assert("sin Bearer retorna 401", res.status === 401);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      assert("verify sin Bearer", false, msg);
    }

  } finally {
    // --- Test 5: Cleanup ---
    console.log("\n[5/5] Limpiar datos de prueba");

    try {
      // sessions borradas en cascade por FK con table/restaurant.
      if (paymentId) await db.payment.delete({ where: { id: paymentId } });
      if (orderId) await db.order.delete({ where: { id: orderId } });
      if (qrCodeId) await db.qrCode.delete({ where: { id: qrCodeId } });
      if (tableId) await db.table.delete({ where: { id: tableId } });
      if (restaurantId) await db.restaurant.delete({ where: { id: restaurantId } });
      if (planId) await db.subscriptionPlan.delete({ where: { id: planId } });
      log("✓", "datos de prueba eliminados");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log("⚠", `cleanup parcial: ${msg}`);
    }

    await db.$disconnect();
  }
}

// --- Run ---
async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  Test: Payment Verify Flow");
  console.log("═══════════════════════════════════════");

  testCrypto();
  await testVerifyFlow();

  console.log("\n═══════════════════════════════════════");
  console.log(`  Resultado: ${passed.length} passed, ${failed.length} failed`);
  console.log("═══════════════════════════════════════\n");

  if (failed.length > 0) {
    console.log("  Fallaron:");
    failed.forEach((f) => console.log(`    ✗ ${f}`));
    console.log("");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\nError fatal:", e.message);
  process.exit(1);
});
