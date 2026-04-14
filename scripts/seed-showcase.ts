/**
 * Seed del restaurante /showcase para pitch demo.
 *
 * Crea (o actualiza):
 *   - User owner: showcase-owner@payr.demo
 *   - SubscriptionPlan ENTERPRISE (si no existe)
 *   - Restaurant con slug "showcase" y credenciales Wompi sandbox COPIADAS
 *     desde un restaurante existente que ya las tiene encriptadas (p.ej. "la-barra").
 *   - Table fija con id "tbl_showcase_demo"
 *
 * Uso: npx tsx scripts/seed-showcase.ts
 *   Opcional: SOURCE_SLUG=la-barra npx tsx scripts/seed-showcase.ts
 */

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import {
  SHOWCASE_PRODUCTS,
  SHOWCASE_UPSELL_IDS,
} from "../lib/data/showcase-products";

dotenv.config({ path: ".env.local" });

const SHOWCASE_SLUG = "showcase";
const SHOWCASE_TABLE_ID = "tbl_showcase_demo";
const OWNER_EMAIL = "showcase-owner@payr.demo";
const SOURCE_SLUG = process.env.SOURCE_SLUG || "la-barra";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está disponible. Verificá .env.local.");
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  console.log("→ Seed /showcase — Crepes & Waffles (Demo)");

  const source = await db.restaurant.findUnique({
    where: { slug: SOURCE_SLUG },
    select: {
      wompi_public_key: true,
      wompi_private_key: true,
      wompi_events_secret: true,
      wompi_integrity_secret: true,
    },
  });

  if (
    !source ||
    !source.wompi_public_key ||
    !source.wompi_private_key ||
    !source.wompi_events_secret ||
    !source.wompi_integrity_secret
  ) {
    throw new Error(
      `No pude copiar credenciales Wompi: el restaurant "${SOURCE_SLUG}" no tiene las 4 credenciales. Pasá SOURCE_SLUG=<otro-slug> si usaste otro seed.`
    );
  }
  console.log(`  ✓ Credenciales Wompi copiadas desde "${SOURCE_SLUG}"`);

  const passwordHash = await bcrypt.hash("showcase-demo-2025", 10);
  const owner = await db.user.upsert({
    where: { email: OWNER_EMAIL },
    update: { password_hash: passwordHash },
    create: {
      email: OWNER_EMAIL,
      name: "Showcase Owner",
      password_hash: passwordHash,
    },
    select: { id: true, email: true },
  });
  console.log(`  ✓ Owner: ${owner.email}`);

  const plan = await db.subscriptionPlan.upsert({
    where: { tier: "ENTERPRISE" },
    update: {},
    create: {
      tier: "ENTERPRISE",
      name: "Enterprise (Demo)",
      max_tables: 999,
      monthly_price_cop: 0,
      allow_split_bill: true,
      allow_upsell: true,
      allow_analytics: true,
      allow_custom_theme: true,
    },
    select: { id: true, name: true },
  });
  console.log(`  ✓ Plan: ${plan.name}`);

  const restaurant = await db.restaurant.upsert({
    where: { slug: SHOWCASE_SLUG },
    update: {
      name: "Crepes & Waffles (Demo)",
      owner_id: owner.id,
      plan_id: plan.id,
      primary_color: "#c8102e",
      secondary_color: "#2d1810",
      background_color: "#fef3e2",
      pos_provider: "demo",
      wompi_public_key: source.wompi_public_key,
      wompi_private_key: source.wompi_private_key,
      wompi_events_secret: source.wompi_events_secret,
      wompi_integrity_secret: source.wompi_integrity_secret,
    },
    create: {
      name: "Crepes & Waffles (Demo)",
      slug: SHOWCASE_SLUG,
      owner_id: owner.id,
      plan_id: plan.id,
      primary_color: "#c8102e",
      secondary_color: "#2d1810",
      background_color: "#fef3e2",
      pos_provider: "demo",
      wompi_public_key: source.wompi_public_key,
      wompi_private_key: source.wompi_private_key,
      wompi_events_secret: source.wompi_events_secret,
      wompi_integrity_secret: source.wompi_integrity_secret,
    },
    select: { id: true, slug: true, name: true },
  });
  console.log(`  ✓ Restaurant: ${restaurant.name} (slug: ${restaurant.slug})`);

  const existingTable = await db.table.findUnique({
    where: { id: SHOWCASE_TABLE_ID },
    select: { id: true, restaurant_id: true },
  });

  if (existingTable) {
    await db.table.update({
      where: { id: SHOWCASE_TABLE_ID },
      data: {
        restaurant_id: restaurant.id,
        label: "Mesa 12",
        status: "AVAILABLE",
      },
    });
    console.log(`  ✓ Table actualizada: ${SHOWCASE_TABLE_ID}`);
  } else {
    await db.table.create({
      data: {
        id: SHOWCASE_TABLE_ID,
        restaurant_id: restaurant.id,
        table_number: 12,
        label: "Mesa 12",
        status: "AVAILABLE",
      },
    });
    console.log(`  ✓ Table creada: ${SHOWCASE_TABLE_ID}`);
  }

  // Upsells demo (reemplaza todos los upsells previos del showcase)
  await db.upsellProduct.deleteMany({ where: { restaurant_id: restaurant.id } });

  const upsells = SHOWCASE_UPSELL_IDS.map((id, idx) => {
    const product = SHOWCASE_PRODUCTS.find((p) => p.id === id);
    if (!product) throw new Error(`Upsell id inválido: ${id}`);
    return {
      restaurant_id: restaurant.id,
      name: product.name,
      description: product.tagline,
      price: product.priceInCents,
      image_url: product.imageUrl,
      is_active: true,
      sort_order: idx,
    };
  });

  await db.upsellProduct.createMany({ data: upsells });
  console.log(`  ✓ ${upsells.length} upsells creados`);

  console.log("\n✅ /showcase listo.");
  console.log(`   URL local: https://localhost:3001/showcase`);
  console.log(`   Tarjeta sandbox: 4242 4242 4242 4242  (CVV 123, fecha futura)`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
