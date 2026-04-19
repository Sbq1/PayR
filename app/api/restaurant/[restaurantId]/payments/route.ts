import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";
import { Prisma } from "@/lib/generated/prisma/client";

// TODO v2: search por reference, date range, export CSV.

const paymentsListLimiter = rateLimit("dashboard-payments", {
  interval: 60_000,
  limit: 60,
});

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const STUCK_WINDOW_MS = 10 * 60 * 1000;

const validStatuses = [
  "PENDING",
  "APPROVED",
  "DECLINED",
  "VOIDED",
  "ERROR",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;
type PaymentStatus = (typeof validStatuses)[number];

// Cursor compuesto (created_at, id) porque payments.id es UUID random
// (gen_random_uuid), no monotónico. Usar WHERE id < cursor solo
// ordenaría alfabéticamente y mezclaría páginas. Tie-break en id
// para estabilidad cuando 2 payments caen en el mismo instante.
function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString("base64url");
}

function decodeCursor(
  raw: string | null,
): { createdAt: Date; id: string } | null | "invalid" {
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf-8");
    const sep = decoded.indexOf("|");
    if (sep < 0) return "invalid";
    const ts = decoded.slice(0, sep);
    const id = decoded.slice(sep + 1);
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "invalid";
    if (
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        id,
      )
    ) {
      return "invalid";
    }
    return { createdAt: d, id };
  } catch {
    return "invalid";
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await paymentsListLimiter.check(`user:${session.user.id}`);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const url = request.nextUrl;
    const statusRaw = url.searchParams.get("status");
    const stuckRaw = url.searchParams.get("stuck_only");
    const limitRaw = url.searchParams.get("limit");
    const cursorRaw = url.searchParams.get("cursor");

    if (statusRaw && !validStatuses.includes(statusRaw as PaymentStatus)) {
      return Response.json({ error: "Estado inválido" }, { status: 400 });
    }

    const parsedLimit = Number(limitRaw);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        Number.isFinite(parsedLimit)
          ? Math.floor(parsedLimit)
          : DEFAULT_LIMIT,
      ),
    );

    const cursor = decodeCursor(cursorRaw);
    if (cursor === "invalid") {
      return Response.json({ error: "Cursor inválido" }, { status: 400 });
    }

    const stuckOnly = stuckRaw === "1" || stuckRaw === "true";
    const stuckBefore = new Date(Date.now() - STUCK_WINDOW_MS);

    const andClauses: Prisma.PaymentWhereInput[] = [];

    if (stuckOnly) {
      andClauses.push({ status: "PENDING" });
      andClauses.push({ created_at: { lt: stuckBefore } });
    } else if (statusRaw) {
      andClauses.push({ status: statusRaw as PaymentStatus });
    }

    if (cursor) {
      andClauses.push({
        OR: [
          { created_at: { lt: cursor.createdAt } },
          { created_at: cursor.createdAt, id: { lt: cursor.id } },
        ],
      });
    }

    const where: Prisma.PaymentWhereInput = {
      orders: { restaurant_id: restaurantId },
      ...(andClauses.length > 0 ? { AND: andClauses } : {}),
    };

    const rows = await db.payment.findMany({
      where,
      select: {
        id: true,
        reference: true,
        status: true,
        amount_in_cents: true,
        refunded_amount: true,
        payment_method_type: true,
        tip_amount: true,
        dian_doc_type: true,
        order_id: true,
        created_at: true,
        paid_at: true,
        orders: {
          select: {
            status: true,
            tables: {
              select: { label: true, table_number: true },
            },
          },
        },
      },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor(last.created_at, last.id) : null;

    const payments = page.map((p) => ({
      id: p.id,
      reference: p.reference,
      status: p.status,
      amount_in_cents: p.amount_in_cents,
      refunded_amount: p.refunded_amount,
      payment_method_type: p.payment_method_type,
      tip_amount: p.tip_amount,
      dian_doc_type: p.dian_doc_type,
      order_id: p.order_id,
      order_status: p.orders.status,
      table_label:
        p.orders.tables.label || `Mesa ${p.orders.tables.table_number}`,
      created_at: p.created_at.toISOString(),
      paid_at: p.paid_at ? p.paid_at.toISOString() : null,
    }));

    return Response.json({ payments, nextCursor });
  } catch (error) {
    return handleApiError(error);
  }
}
