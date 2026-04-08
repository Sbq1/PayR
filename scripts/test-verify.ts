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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
    } catch (e: any) {
      assert(
        "decrypt de texto plano lanza error",
        e.message === "Invalid encrypted text format"
      );
    }
  } catch (e: any) {
    assert("crypto funciona", false, e.message);
  }
}

// --- Test 2-4: DB + Verify endpoint ---
async function testVerifyFlow() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });

  const testRef = `TEST-VERIFY-${Date.now()}`;
  let restaurantId = "";
  let tableId = "";
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

    // --- Test 3: Verify endpoint ---
    console.log("\n[3/4] Llamar POST /api/payment/verify");

    try {
      const res = await fetch(`${BASE_URL}/api/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: testRef }),
      });

      const data = await res.json();

      assert("verify responde 200", res.status === 200);
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
    } catch (e: any) {
      assert("verify endpoint accesible", false, `servidor corriendo en ${BASE_URL}? — ${e.message}`);
    }

    // --- Test 3b: Verify con referencia inexistente ---
    console.log("\n[3b] Verify con referencia inexistente");
    try {
      const res = await fetch(`${BASE_URL}/api/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: "REF-NO-EXISTE-999" }),
      });
      assert("referencia inexistente retorna 404", res.status === 404);
    } catch (e: any) {
      assert("verify ref inexistente", false, e.message);
    }

    // --- Test 3c: Verify sin body ---
    console.log("\n[3c] Verify sin reference");
    try {
      const res = await fetch(`${BASE_URL}/api/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert("sin reference retorna 400", res.status === 400);
    } catch (e: any) {
      assert("verify sin body", false, e.message);
    }

  } finally {
    // --- Test 4: Cleanup ---
    console.log("\n[4/4] Limpiar datos de prueba");

    try {
      if (paymentId) await db.payment.delete({ where: { id: paymentId } });
      if (orderId) await db.order.delete({ where: { id: orderId } });
      if (tableId) await db.table.delete({ where: { id: tableId } });
      if (restaurantId) await db.restaurant.delete({ where: { id: restaurantId } });
      if (planId) await db.subscriptionPlan.delete({ where: { id: planId } });
      log("✓", "datos de prueba eliminados");
    } catch (e: any) {
      log("⚠", `cleanup parcial: ${e.message}`);
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
