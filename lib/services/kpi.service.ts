import { db } from "@/lib/db";
import { getDayRange, getWeekRange, getMonthRange } from "@/lib/utils/date";
import type { KpiDashboard, KpiPeriod } from "@/types/kpi";

export async function getKpiDashboard(
  restaurantId: string,
  period: KpiPeriod = "today"
): Promise<KpiDashboard> {
  const range = getDateRange(period);

  const [orders, payments, orderItems] = await Promise.all([
    db.order.findMany({
      where: {
        restaurant_id: restaurantId,
        status: "PAID",
        created_at: { gte: range.start, lte: range.end },
      },
      orderBy: { created_at: "asc" },
    }),
    db.payment.findMany({
      where: {
        orders: { restaurant_id: restaurantId },
        status: "APPROVED",
        created_at: { gte: range.start, lte: range.end },
      },
    }),
    db.orderItem.findMany({
      where: {
        orders: {
          restaurant_id: restaurantId,
          status: "PAID",
          created_at: { gte: range.start, lte: range.end },
        },
      },
    }),
  ]);

  // Overview
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const orderCount = orders.length;
  const avgTicket = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;
  const tipsWithValue = orders.filter((o) => o.tip_percentage && o.tip_percentage > 0);
  const avgTipPercentage =
    tipsWithValue.length > 0
      ? Math.round(
          tipsWithValue.reduce((sum, o) => sum + (o.tip_percentage || 0), 0) /
            tipsWithValue.length
        )
      : 0;

  // Sales over time
  const salesByDate = new Map<string, { sales: number; orders: number }>();
  for (const order of orders) {
    const date = order.created_at.toISOString().split("T")[0];
    const existing = salesByDate.get(date) || { sales: 0, orders: 0 };
    existing.sales += order.total;
    existing.orders += 1;
    salesByDate.set(date, existing);
  }
  const salesOverTime = Array.from(salesByDate.entries()).map(
    ([date, data]) => ({ date, ...data })
  );

  // Top products
  const productMap = new Map<string, { quantity: number; revenue: number }>();
  for (const item of orderItems) {
    const existing = productMap.get(item.name) || { quantity: 0, revenue: 0 };
    existing.quantity += item.quantity;
    existing.revenue += item.total_price;
    productMap.set(item.name, existing);
  }
  const topProducts = Array.from(productMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Payment methods
  const methodMap = new Map<string, number>();
  for (const payment of payments) {
    const method = payment.payment_method_type || "Otro";
    methodMap.set(method, (methodMap.get(method) || 0) + 1);
  }
  const totalPayments = payments.length || 1;
  const paymentMethods = Array.from(methodMap.entries()).map(
    ([method, count]) => ({
      method,
      count,
      percentage: Math.round((count / totalPayments) * 100),
    })
  );

  // Peak hours
  const hourMap = new Map<number, { orders: number; sales: number }>();
  for (const order of orders) {
    const hour = order.created_at.getHours();
    const existing = hourMap.get(hour) || { orders: 0, sales: 0 };
    existing.orders += 1;
    existing.sales += order.total;
    hourMap.set(hour, existing);
  }
  const peakHours = Array.from(hourMap.entries())
    .map(([hour, data]) => ({ hour, ...data }))
    .sort((a, b) => a.hour - b.hour);

  // Upsell conversion
  const upsellItems = orderItems.filter((i) => i.is_upsell);
  const upsellConversion = {
    offered: orderCount, // simplificado: asumimos que se ofrecio en cada orden
    accepted: new Set(upsellItems.map((i) => i.order_id)).size,
    rate:
      orderCount > 0
        ? Math.round(
            (new Set(upsellItems.map((i) => i.order_id)).size / orderCount) *
              100
          )
        : 0,
  };

  return {
    overview: { totalSales, orderCount, avgTicket, avgTipPercentage },
    salesOverTime,
    topProducts,
    paymentMethods,
    peakHours,
    upsellConversion,
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
