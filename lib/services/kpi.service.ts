import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { getDayRange, getWeekRange, getMonthRange, getPreviousRange } from "@/lib/utils/date";
import type { KpiDashboard, KpiPeriod } from "@/types/kpi";

export async function getKpiDashboard(
  restaurantId: string,
  period: KpiPeriod = "today"
): Promise<KpiDashboard> {
  const range = getDateRange(period);
  const where = {
    restaurant_id: restaurantId,
    status: "PAID" as const,
    created_at: { gte: range.start, lte: range.end },
  };

  // 1. Overview aggregates
  const [orderAgg, tipAgg] = await Promise.all([
    db.order.aggregate({
      where,
      _sum: { total: true },
      _count: { id: true },
      _avg: { total: true },
    }),
    db.order.aggregate({
      where: { ...where, tip_percentage: { gt: 0 } },
      _avg: { tip_percentage: true },
    }),
  ]);

  const totalSales = orderAgg._sum.total ?? 0;
  const orderCount = orderAgg._count.id;
  const avgTicket = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;
  const avgTipPercentage = Math.round(tipAgg._avg.tip_percentage ?? 0);

  // 2. Remaining queries in parallel
  const prevRange = getPreviousRange(period);
  const [salesRaw, topProducts, paymentMethodsRaw, peakHoursRaw, upsellOrders, prevAgg] =
    await Promise.all([
      // Sales over time
      db.$queryRaw<Array<{ date: string; sales: bigint; orders: bigint }>>`
        SELECT DATE(created_at) AS date,
               SUM(total) AS sales,
               COUNT(*) AS orders
        FROM orders
        WHERE restaurant_id = ${restaurantId}
          AND status = 'PAID'
          AND created_at >= ${range.start}
          AND created_at <= ${range.end}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `,

      // Top products
      db.orderItem.groupBy({
        by: ["name"],
        where: {
          orders: where,
        },
        _sum: { quantity: true, total_price: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),

      // Payment methods
      db.payment.groupBy({
        by: ["payment_method_type"],
        where: {
          orders: { restaurant_id: restaurantId },
          status: "APPROVED",
          created_at: { gte: range.start, lte: range.end },
        },
        _count: { id: true },
      }),

      // Peak hours
      db.$queryRaw<Array<{ hour: number; orders: bigint; sales: bigint }>>`
        SELECT EXTRACT(HOUR FROM created_at)::int AS hour,
               COUNT(*) AS orders,
               SUM(total) AS sales
        FROM orders
        WHERE restaurant_id = ${restaurantId}
          AND status = 'PAID'
          AND created_at >= ${range.start}
          AND created_at <= ${range.end}
        GROUP BY EXTRACT(HOUR FROM created_at)::int
        ORDER BY hour
      `,

      // Upsell conversion: count distinct orders with upsell items
      db.orderItem.groupBy({
        by: ["order_id"],
        where: {
          is_upsell: true,
          orders: where,
        },
      }),

      // Previous period aggregates for comparison
      db.order.aggregate({
        where: {
          restaurant_id: restaurantId,
          status: "PAID" as const,
          created_at: { gte: prevRange.start, lte: prevRange.end },
        },
        _sum: { total: true },
        _count: { id: true },
      }),
    ]);

  // 3. Transform results
  const salesOverTime = salesRaw.map((r) => ({
    date: String(r.date),
    sales: Number(r.sales),
    orders: Number(r.orders),
  }));

  const topProductsMapped = topProducts.map((p) => ({
    name: p.name,
    quantity: p._sum.quantity ?? 0,
    revenue: p._sum.total_price ?? 0,
  }));

  const totalPaymentCount = paymentMethodsRaw.reduce((s, p) => s + p._count.id, 0) || 1;
  const paymentMethods = paymentMethodsRaw.map((p) => ({
    method: p.payment_method_type || "Otro",
    count: p._count.id,
    percentage: Math.round((p._count.id / totalPaymentCount) * 100),
  }));

  const peakHours = peakHoursRaw.map((r) => ({
    hour: r.hour,
    orders: Number(r.orders),
    sales: Number(r.sales),
  }));

  const upsellAccepted = upsellOrders.length;
  const upsellConversion = {
    offered: orderCount,
    accepted: upsellAccepted,
    rate: orderCount > 0 ? Math.round((upsellAccepted / orderCount) * 100) : 0,
  };

  // Derived: best seller, avg daily revenue, comparison deltas
  const bestSeller = topProductsMapped.length > 0 ? topProductsMapped[0] : null;
  const avgDailyRevenue =
    salesOverTime.length > 0
      ? Math.round(totalSales / salesOverTime.length)
      : 0;

  const prevSales = prevAgg._sum.total ?? 0;
  const prevOrders = prevAgg._count.id;
  const salesDelta =
    prevSales > 0 ? Math.round(((totalSales - prevSales) / prevSales) * 100) : 0;
  const ordersDelta =
    prevOrders > 0 ? Math.round(((orderCount - prevOrders) / prevOrders) * 100) : 0;

  return {
    overview: { totalSales, orderCount, avgTicket, avgTipPercentage },
    salesOverTime,
    topProducts: topProductsMapped,
    paymentMethods,
    peakHours,
    upsellConversion,
    bestSeller,
    avgDailyRevenue,
    comparison: { salesDelta, ordersDelta },
  };
}

function getDateRange(period: KpiPeriod) {
  switch (period) {
    case "today":
      return getDayRange();
    case "week":
      return getWeekRange();
    case "month":
      return getMonthRange();
    default:
      return getMonthRange();
  }
}
