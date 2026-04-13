import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/utils/rate-limit";
import { z } from "zod/v4";
import { Prisma } from "@/lib/generated/prisma/client";

const ordersListLimiter = rateLimit("orders-list", { interval: 60_000, limit: 60 });
const ordersCancelLimiter = rateLimit("orders-cancel", { interval: 60_000, limit: 30 });
const PAGE_SIZE = 20;
const MAX_PAGE = 500;
const MAX_DATE_RANGE_DAYS = 366;

const validStatuses = ["PENDING", "PAYING", "PAID", "CANCELLED"] as const;
type OrderStatus = (typeof validStatuses)[number];

// ─── Helpers ──────────────────────────────────────────────────────

function parseDateParam(raw: string | null): Date | null | "invalid" {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "invalid";
  return d;
}

// GET /api/restaurant/[restaurantId]/orders?status=&from=&to=&page=&q=
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await ordersListLimiter.check(getClientIp(request));
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const url = request.nextUrl;
    const statusRaw = url.searchParams.get("status");
    const fromRaw = url.searchParams.get("from");
    const toRaw = url.searchParams.get("to");
    const pageRaw = url.searchParams.get("page");
    const qRaw = url.searchParams.get("q");

    // Status validation
    if (statusRaw && !validStatuses.includes(statusRaw as OrderStatus)) {
      return Response.json({ error: "Estado inválido" }, { status: 400 });
    }

    // Date validation (reject malformed)
    const from = parseDateParam(fromRaw);
    const to = parseDateParam(toRaw);
    if (from === "invalid" || to === "invalid") {
      return Response.json({ error: "Fecha inválida" }, { status: 400 });
    }

    // Range limit
    if (from && to) {
      const days = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      if (days < 0) {
        return Response.json({ error: "El rango de fechas está invertido" }, { status: 400 });
      }
      if (days > MAX_DATE_RANGE_DAYS) {
        return Response.json(
          { error: `Rango de fechas no puede exceder ${MAX_DATE_RANGE_DAYS} días` },
          { status: 400 },
        );
      }
    }

    // Page validation
    const parsedPage = Number(pageRaw);
    const page = Math.min(
      MAX_PAGE,
      Math.max(1, Number.isFinite(parsedPage) ? Math.floor(parsedPage) : 1),
    );

    // Search — limit length to avoid DoS via huge LIKE patterns
    const q = qRaw ? qRaw.trim().slice(0, 80) : null;

    const where: Prisma.OrderWhereInput = { restaurant_id: restaurantId };
    if (statusRaw) where.status = statusRaw as OrderStatus;

    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = from;
      if (to) {
        to.setHours(23, 59, 59, 999);
        where.created_at.lte = to;
      }
    }

    if (q) {
      // Search across: order id prefix, table number/label, item name, payment reference
      const tableNumber = /^\d+$/.test(q) ? Number(q) : undefined;
      where.OR = [
        { id: { startsWith: q } },
        { tables: { label: { contains: q, mode: "insensitive" } } },
        ...(tableNumber !== undefined ? [{ tables: { table_number: tableNumber } }] : []),
        { order_items: { some: { name: { contains: q, mode: "insensitive" } } } },
        { payments: { some: { reference: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          tables: { select: { table_number: true, label: true } },
          order_items: {
            select: {
              id: true,
              name: true,
              quantity: true,
              unit_price: true,
              total_price: true,
              is_upsell: true,
            },
          },
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
          cancelled_by: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { created_at: "desc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      db.order.count({ where }),
    ]);

    return Response.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── Cancel ───────────────────────────────────────────────────────

const cancelSchema = z.object({
  orderId: z.string().min(1).max(64),
  status: z.literal("CANCELLED"),
});

// PATCH /api/restaurant/[restaurantId]/orders — Cancel an order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await ordersCancelLimiter.check(getClientIp(request));
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Body inválido" }, { status: 400 });
    }

    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { orderId } = parsed.data;
    const userId = session.user.id;

    // Atomic: verify + guard Payment + update order + release table
    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, restaurant_id: restaurantId },
        select: {
          id: true,
          status: true,
          table_id: true,
          payments: {
            select: { status: true },
            where: { status: { in: ["PENDING", "APPROVED"] } },
          },
        },
      });

      if (!order) {
        return { ok: false as const, status: 404, error: "Orden no encontrada" };
      }

      if (order.status !== "PENDING") {
        return {
          ok: false as const,
          status: 409,
          error: `No se puede cancelar una orden con estado ${order.status}`,
        };
      }

      if (order.payments.length > 0) {
        return {
          ok: false as const,
          status: 409,
          error: "La orden tiene un pago en proceso o aprobado — no se puede cancelar",
        };
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          cancelled_by_user_id: userId,
          cancelled_at: new Date(),
        },
      });

      await tx.table.update({
        where: { id: order.table_id },
        data: { status: "AVAILABLE" },
      });

      return { ok: true as const, order: updated };
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    return Response.json(result.order);
  } catch (error) {
    return handleApiError(error);
  }
}
