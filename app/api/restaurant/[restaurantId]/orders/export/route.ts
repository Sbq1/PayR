import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";
import { buildCsv } from "@/lib/utils/csv";
import { Prisma } from "@/lib/generated/prisma/client";

const exportLimiter = rateLimit("orders-export", { interval: 60_000, limit: 5 });
const MAX_EXPORT_DAYS = 90;
const MAX_EXPORT_ROWS = 10_000;

const validStatuses = ["PENDING", "PAYING", "PAID", "CANCELLED"] as const;
type OrderStatus = (typeof validStatuses)[number];

function parseDateParam(raw: string | null): Date | null | "invalid" {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "invalid";
  return d;
}

// GET /api/restaurant/[restaurantId]/orders/export?status=&from=&to=
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await exportLimiter.check(`user:${session.user.id}`);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const url = request.nextUrl;
    const statusRaw = url.searchParams.get("status");
    const fromRaw = url.searchParams.get("from");
    const toRaw = url.searchParams.get("to");

    if (statusRaw && !validStatuses.includes(statusRaw as OrderStatus)) {
      return Response.json({ error: "Estado inválido" }, { status: 400 });
    }

    const from = parseDateParam(fromRaw);
    const to = parseDateParam(toRaw);
    if (from === "invalid" || to === "invalid") {
      return Response.json({ error: "Fecha inválida" }, { status: 400 });
    }

    // Default: last 90 days if no range provided
    const now = new Date();
    const rangeTo = to ?? now;
    const rangeFrom =
      from ?? new Date(now.getTime() - MAX_EXPORT_DAYS * 24 * 60 * 60 * 1000);

    const spanDays =
      (rangeTo.getTime() - rangeFrom.getTime()) / (1000 * 60 * 60 * 24);
    if (spanDays < 0) {
      return Response.json({ error: "El rango está invertido" }, { status: 400 });
    }
    if (spanDays > MAX_EXPORT_DAYS) {
      return Response.json(
        { error: `El export está limitado a ${MAX_EXPORT_DAYS} días` },
        { status: 400 },
      );
    }

    rangeTo.setHours(23, 59, 59, 999);

    const where: Prisma.OrderWhereInput = {
      restaurant_id: restaurantId,
      created_at: { gte: rangeFrom, lte: rangeTo },
    };
    if (statusRaw) where.status = statusRaw as OrderStatus;

    const orders = await db.order.findMany({
      where,
      include: {
        tables: { select: { table_number: true, label: true } },
        payments: {
          select: {
            reference: true,
            status: true,
            payment_method_type: true,
            amount_in_cents: true,
            paid_at: true,
          },
          orderBy: { created_at: "desc" },
          take: 1,
        },
        cancelled_by: { select: { email: true } },
      },
      orderBy: { created_at: "desc" },
      take: MAX_EXPORT_ROWS,
    });

    const header = [
      "Orden ID",
      "Fecha",
      "Mesa",
      "Personas",
      "Estado",
      "Subtotal",
      "Impuesto",
      "Propina",
      "Total",
      "Referencia pago",
      "Método pago",
      "Estado pago",
      "Pagado en",
      "Factura Siigo",
      "Cancelada por",
      "Cancelada en",
    ];

    const rows: unknown[][] = [header];
    for (const o of orders) {
      const p = o.payments[0];
      const tableLabel = o.tables.label || `Mesa ${o.tables.table_number}`;
      rows.push([
        o.id,
        o.created_at.toISOString(),
        tableLabel,
        o.customer_count,
        o.status,
        (o.subtotal / 100).toFixed(2),
        (o.tax / 100).toFixed(2),
        (o.tip_amount / 100).toFixed(2),
        (o.total / 100).toFixed(2),
        p?.reference ?? "",
        p?.payment_method_type ?? "",
        p?.status ?? "",
        p?.paid_at?.toISOString() ?? "",
        o.siigo_invoice_id ?? "",
        o.cancelled_by?.email ?? "",
        o.cancelled_at?.toISOString() ?? "",
      ]);
    }

    const csv = buildCsv(rows);
    const filename = `ordenes-${rangeFrom.toISOString().slice(0, 10)}-a-${rangeTo.toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
