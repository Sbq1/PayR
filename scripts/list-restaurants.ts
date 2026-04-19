import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const db = new PrismaClient({ adapter });
  const rows = await db.restaurant.findMany({
    select: {
      slug: true,
      name: true,
      is_active: true,
      wompi_public_key: true,
      wompi_private_key: true,
      wompi_events_secret: true,
      wompi_integrity_secret: true,
      fe_regime: true,
    },
    take: 20,
  });
  const summary = rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    active: r.is_active,
    hasWompiPub: !!r.wompi_public_key,
    hasWompiPriv: !!r.wompi_private_key,
    hasWompiEvents: !!r.wompi_events_secret,
    hasWompiIntegrity: !!r.wompi_integrity_secret,
    fe_regime: r.fe_regime,
  }));
  console.log(JSON.stringify(summary, null, 2));
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
