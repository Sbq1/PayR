import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const ref = process.argv[2];
  if (!ref) {
    console.error("Usage: check-payment-status.ts <reference>");
    process.exit(1);
  }
  const p = await db.payment.findUnique({
    where: { reference: ref },
    select: {
      reference: true,
      status: true,
      paid_at: true,
      created_at: true,
      amount_in_cents: true,
    },
  });
  console.log(JSON.stringify(p ?? { error: "not found" }, null, 2));
  await db.$disconnect();
}

main();
