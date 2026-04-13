"use client";

import { useEffect, useState } from "react";
import { BarChart, AreaChart, DonutChart } from "@tremor/react";
import {
  DollarSign,
  ShoppingBag,
  Receipt,
  Percent,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Star,
  Sparkles,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useSession } from "@/hooks/use-session";
import type { KpiDashboard, KpiPeriod } from "@/types/kpi";

const periodLabels: Record<KpiPeriod, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
};

export default function DashboardPage() {
  const { restaurantId } = useSession();
  const [period, setPeriod] = useState<KpiPeriod>("month");
  const [data, setData] = useState<KpiDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/restaurant/${restaurantId}/kpi?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [restaurantId, period]);

  const kpiCards = [
    {
      title: "Ventas totales",
      rawValue: data?.overview.totalSales ?? 0,
      prefix: "$",
      suffix: "",
      isCurrency: true,
      delta: data?.comparison?.salesDelta ?? 0,
      icon: DollarSign,
      accent: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Ticket promedio",
      rawValue: data?.overview.avgTicket ?? 0,
      prefix: "$",
      suffix: "",
      isCurrency: true,
      delta: null,
      icon: Receipt,
      accent: "bg-violet-50 text-violet-600",
    },
    {
      title: "Órdenes",
      rawValue: data?.overview.orderCount ?? 0,
      prefix: "",
      suffix: "",
      isCurrency: false,
      delta: data?.comparison?.ordersDelta ?? 0,
      icon: ShoppingBag,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Propina prom.",
      rawValue: data?.overview.avgTipPercentage ?? 0,
      prefix: "",
      suffix: "%",
      isCurrency: false,
      delta: null,
      icon: Percent,
      accent: "bg-amber-50 text-amber-600",
    },
  ];

  const salesChartData = (data?.salesOverTime || []).map((d) => ({
    date: d.date,
    Ventas: d.sales / 100,
  }));

  const productsChartData = (data?.topProducts || []).map((p) => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + "..." : p.name,
    Cantidad: p.quantity,
  }));

  const paymentMethodsData = (data?.paymentMethods || []).map((m) => ({
    name: m.method,
    value: m.count,
  }));

  const peakHoursData = (data?.peakHours || []).map((h) => ({
    Hora: `${h.hour}:00`,
    Ordenes: h.orders,
  }));

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">
            Performance Overview
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5 capitalize">
            {dateStr}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(["today", "week", "month"] as KpiPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                period === p
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <div
                key={kpi.title}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    {kpi.title}
                  </p>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.accent}`}
                  >
                    <kpi.icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-[24px] font-bold text-gray-900 tabular-nums">
                    <AnimatedCounter
                      target={
                        kpi.isCurrency
                          ? Math.round(kpi.rawValue / 100)
                          : kpi.rawValue
                      }
                      prefix={kpi.prefix}
                      suffix={kpi.suffix}
                      duration={1500}
                    />
                  </span>
                  {kpi.delta !== null && kpi.delta !== 0 && (
                    <span
                      className={`flex items-center gap-0.5 text-[11px] font-medium pb-1 ${
                        kpi.delta > 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {kpi.delta > 0 ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {Math.abs(kpi.delta)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Insights Row ── */}
          {(data?.bestSeller || data?.avgDailyRevenue || data?.upsellConversion?.rate) && (
            <div className="flex flex-wrap gap-4">
              {data?.bestSeller && (
                <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-4 py-2.5">
                  <Star className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Plato estrella
                    </p>
                    <p className="text-[13px] font-semibold text-gray-900">
                      {data.bestSeller.name}{" "}
                      <span className="text-gray-500 font-normal">
                        — {data.bestSeller.quantity} vendidos
                      </span>
                    </p>
                  </div>
                </div>
              )}
              {data?.avgDailyRevenue > 0 && (
                <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-4 py-2.5">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Promedio diario
                    </p>
                    <p className="text-[13px] font-semibold text-gray-900">
                      $
                      {new Intl.NumberFormat("es-CO").format(
                        Math.round(data.avgDailyRevenue / 100)
                      )}
                    </p>
                  </div>
                </div>
              )}
              {data?.upsellConversion?.rate > 0 && (
                <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-4 py-2.5">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Conversión sugeridos
                    </p>
                    <p className="text-[13px] font-semibold text-gray-900">
                      {data.upsellConversion.rate}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Sales Chart (full width) ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-[13px] font-medium text-gray-500 mb-4">
              Ventas por día
            </p>
            {salesChartData.length > 0 ? (
              <AreaChart
                data={salesChartData}
                index="date"
                categories={["Ventas"]}
                colors={["indigo"]}
                valueFormatter={(v) =>
                  `$${new Intl.NumberFormat("es-CO").format(v)}`
                }
                className="h-56"
                showLegend={false}
              />
            ) : (
              <p className="text-[13px] text-gray-400 text-center py-16">
                Sin datos para este periodo
              </p>
            )}
          </div>

          {/* ── Charts Row ── */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-[13px] font-medium text-gray-500 mb-4">
                Horas pico
              </p>
              {peakHoursData.length > 0 ? (
                <BarChart
                  data={peakHoursData}
                  index="Hora"
                  categories={["Ordenes"]}
                  colors={["indigo"]}
                  className="h-52"
                  showLegend={false}
                />
              ) : (
                <p className="text-[13px] text-gray-400 text-center py-12">
                  Sin datos para este periodo
                </p>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-[13px] font-medium text-gray-500 mb-4">
                Métodos de pago
              </p>
              {paymentMethodsData.length > 0 ? (
                <DonutChart
                  data={paymentMethodsData}
                  category="value"
                  index="name"
                  colors={["indigo", "violet", "slate", "emerald", "amber"]}
                  className="h-52"
                />
              ) : (
                <p className="text-[13px] text-gray-400 text-center py-12">
                  Sin datos para este periodo
                </p>
              )}
            </div>
          </div>

          {/* ── Products Chart ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-[13px] font-medium text-gray-500 mb-4">
              Productos más vendidos
            </p>
            {productsChartData.length > 0 ? (
              <BarChart
                data={productsChartData}
                index="name"
                categories={["Cantidad"]}
                colors={["violet"]}
                className="h-52"
                showLegend={false}
                layout="vertical"
              />
            ) : (
              <p className="text-[13px] text-gray-400 text-center py-12">
                Sin datos para este periodo
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
