/**
 * Genera las URLs firmadas de QR para las mesas del piloto.
 *
 * Cada URL incluye el token HMAC + versión como query params, que el
 * endpoint /api/session/start exige desde Fase 1. Sin este batch, los
 * QR impresos apuntarían a la URL vieja (sin token) y los comensales
 * verían "QR_INVALID".
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/generate-signed-qr-batch.ts
 *   npx tsx ... scripts/generate-signed-qr-batch.ts --slug la-barra
 *   npx tsx ... scripts/generate-signed-qr-batch.ts --update  (persiste en qr_codes.url)
 *
 * Env obligatorias: DATABASE_URL, QR_SECRET (≥32 chars), NEXT_PUBLIC_APP_URL.
 */
import { db } from "../lib/db";
import { signQrToken } from "../lib/services/qr-token.service";

interface Options {
  slug: string | null;
  update: boolean;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { slug: null, update: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--update") opts.update = true;
    else if (a === "--slug" && argv[i + 1]) {
      opts.slug = argv[++i];
    }
  }
  return opts;
}

function getAppUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";
  // Normalizar: quitar trailing slash y agregar https:// si es dominio pelado.
  const clean = url.replace(/\/+$/, "");
  if (/^https?:\/\//.test(clean)) return clean;
  return `https://${clean}`;
}

async function main() {
  const opts = parseArgs(process.argv);
  const appUrl = getAppUrl();

  const tables = await db.table.findMany({
    where: {
      is_active: true,
      qr_codes: { isNot: null },
      ...(opts.slug
        ? { restaurants: { slug: opts.slug } }
        : {}),
    },
    include: {
      restaurants: { select: { slug: true, name: true, is_active: true } },
      qr_codes: { select: { id: true, token_version: true, is_active: true } },
    },
    orderBy: [{ restaurant_id: "asc" }, { table_number: "asc" }],
  });

  if (tables.length === 0) {
    console.error(
      opts.slug
        ? `No hay mesas activas con QR para slug="${opts.slug}"`
        : "No hay mesas activas con QR en la base"
    );
    process.exit(1);
  }

  interface Row {
    restaurant: string;
    table_number: number;
    label: string | null;
    url: string;
    qr_id: string;
  }

  const rows: Row[] = [];
  for (const t of tables) {
    if (!t.qr_codes || !t.qr_codes.is_active || !t.restaurants.is_active) {
      continue;
    }
    const token = signQrToken(t.id, t.qr_codes.token_version);
    const url = `${appUrl}/${t.restaurants.slug}/${encodeURIComponent(
      t.id
    )}?qrToken=${encodeURIComponent(token)}&qrVersion=${t.qr_codes.token_version}`;

    rows.push({
      restaurant: t.restaurants.slug,
      table_number: t.table_number,
      label: t.label,
      url,
      qr_id: t.qr_codes.id,
    });
  }

  // Output CSV a stdout (pipeable). Columnas: restaurant,table,label,url
  console.log("restaurant,table,label,url");
  for (const r of rows) {
    // Escape comas en label para CSV.
    const safeLabel = (r.label ?? "").replace(/"/g, '""');
    console.log(
      `${r.restaurant},${r.table_number},"${safeLabel}",${r.url}`
    );
  }

  if (opts.update) {
    console.error(`\nActualizando qr_codes.url para ${rows.length} mesas...`);
    for (const r of rows) {
      await db.qrCode.update({
        where: { id: r.qr_id },
        data: { url: r.url },
      });
    }
    console.error("Done.");
  } else {
    console.error(
      `\n${rows.length} QRs generados. Corré con --update para persistir en qr_codes.url.`
    );
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
