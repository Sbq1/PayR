import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const p = await db.payment.findFirst({
    where: {
      status: "PENDING",
      orders: { restaurants: { slug: "smoke-test-payr" } },
    },
    select: { reference: true, amount_in_cents: true },
    orderBy: { created_at: "desc" },
  });
  console.log(JSON.stringify(p ?? {}));
  await db.$disconnect();
}

main();
