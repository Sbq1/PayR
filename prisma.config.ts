import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first, fallback to .env
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // MIGRATION_URL usa el role `postgres` (superuser) — necesario para DDL
    // (CREATE TABLE, ALTER TYPE, etc.) que el role `payr_prod` de DIRECT_URL
    // no tiene permiso para ejecutar. Principio de mínimo privilegio:
    // runtime usa payr_prod limitado; migraciones usan postgres superuser.
    url: process.env["MIGRATION_URL"] ?? process.env["DIRECT_URL"]!,
  },
});
