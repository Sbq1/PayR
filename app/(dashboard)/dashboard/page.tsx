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
  BarChart3,
  PieChart,
  LineChart,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useSession } from "@/hooks/use-session";
import { PendingAlertBanner } from "../_components/pending-alert-banner";
import type { KpiDashboard, KpiPeriod } from "@/types/kpi";

const periodLabels: Record<KpiPeriod, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
};

const EmptyChartState = ({ title, icon: Icon }: { title: string; icon: LucideIcon }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-full bg-[#f5f5f4] flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-[#78716c]" strokeWidth={1.5} />
    </div>
    <h3 className="text-[18px] font-serif font-bold text-[#1c1410] mb-1">
      Sin datos para este periodo
    </h3>
    <p className="text-[13px] text-[#78716c]">
      No hay actividad suficiente para mostrar {title.toLowerCase()}.
    </p>
  </div>
);

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
      accentBg: "bg-[#c2410c]/10",
      accentIcon: "text-[#c2410c]",
    },
    {
      title: "Ticket promedio",
      rawValue: data?.overview.avgTicket ?? 0,
      prefix: "$",
      suffix: "",
      isCurrency: true,
      delta: null,
      icon: Receipt,
      accentBg: "bg-[#1c1410]/10",
      accentIcon: "text-[#1c1410]",
    },
    {
      title: "Órdenes",
      rawValue: data?.overview.orderCount ?? 0,
      prefix: "",
      suffix: "",
      isCurrency: false,
      delta: data?.comparison?.ordersDelta ?? 0,
      icon: ShoppingBag,
      accentBg: "bg-emerald-50",
      accentIcon: "text-emerald-700",
    },
    {
      title: "Propina prom.",
      rawValue: data?.overview.avgTipPercentage ?? 0,
      prefix: "",
      suffix: "%",
      isCurrency: false,
      delta: null,
      icon: Percent,
      accentBg: "bg-amber-50",
      accentIcon: "text-amber-600",
    },
  ];

  const salesChartData = (data?.salesOverTime || []).map((d) => ({
    date: d.date,
    Ventas: d.sales / 100,
  }));

  const productsChartData = (data?.topProducts || []).map((p) => ({
    name: p.name.length > 25 ? p.name.slice(0, 25) + "..." : p.name,
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
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1c1410] font-serif tracking-tight">
            Performance Overview
          </h1>
          <p className="text-[14px] text-[#78716c] mt-0.5 capitalize">
            {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#f5f5f4] p-1 rounded-xl">
          {(["today", "week", "month"] as KpiPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-[10px] text-[13px] font-medium transition-all ${
                period === p
                  ? "bg-[#c2410c] text-white shadow-sm elev-sm"
                  : "text-[#78716c] hover:text-[#1c1410]"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <PendingAlertBanner />

      {loading ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[140px] rounded-[20px] bg-white border border-[#e7e5e4] p-5">
                 <div className="flex justify-between">
                    <div className="h-3 w-20 bg-[#f5f5f4] rounded-full animate-pulse"></div>
                    <div className="h-10 w-10 bg-[#f5f5f4] rounded-xl animate-pulse"></div>
                 </div>
                 <div className="h-10 w-28 bg-[#f5f5f4] rounded-lg mt-4 animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="h-[360px] rounded-[24px] bg-white border border-[#e7e5e4] animate-pulse" />
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <div
                key={kpi.title}
                className="group rounded-[20px] border border-[#e7e5e4] bg-white p-5 elev-sm card-lift"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-medium text-[#78716c] uppercase tracking-widest">
                    {kpi.title}
                  </p>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${kpi.accentBg} ${kpi.accentIcon}`}
                  >
                    <kpi.icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                </div>
                <div className="flex items-end gap-2.5">
                  <span className="text-[32px] font-bold text-[#1c1410] font-serif tabular-nums leading-none tracking-tight">
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
                      className={`flex items-center gap-0.5 text-[13px] font-medium pb-[3px] ${
                        kpi.delta > 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {kpi.delta > 0 ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
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
            <div className="flex flex-wrap gap-3">
              {data?.bestSeller && (
                <div className="flex items-center gap-3 rounded-full bg-[#f5f5f4] px-5 py-2.5 border border-transparent hover:border-[#e7e5e4] transition-colors">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  <p className="text-[14px] font-medium text-[#1c1410]">
                    {data.bestSeller.name} <span className="text-[#78716c] font-normal mx-1">—</span> {data.bestSeller.quantity} vendidos
                  </p>
                </div>
              )}
              {data?.avgDailyRevenue > 0 && (
                <div className="flex items-center gap-3 rounded-full bg-[#f5f5f4] px-5 py-2.5 border border-transparent hover:border-[#e7e5e4] transition-colors">
                  <TrendingUp className="w-4 h-4 text-[#c2410c]" />
                  <p className="text-[14px] font-medium text-[#1c1410]">
                    <span className="text-[#78716c] font-normal mr-2">Promedio diario</span>
                    ${new Intl.NumberFormat("es-CO").format(Math.round(data.avgDailyRevenue / 100))}
                  </p>
                </div>
              )}
              {data?.upsellConversion?.rate > 0 && (
                <div className="flex items-center gap-3 rounded-full bg-[#f5f5f4] px-5 py-2.5 border border-transparent hover:border-[#e7e5e4] transition-colors">
                  <Sparkles className="w-4 h-4 text-[#1c1410]" />
                  <p className="text-[14px] font-medium text-[#1c1410]">
                    <span className="text-[#78716c] font-normal mr-2">Sugeridos</span>
                    {data.upsellConversion.rate}% conv.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Sales Chart (full width) ── */}
          <div className="rounded-[24px] border border-[#e7e5e4] bg-white p-6 elev-sm">
            <h3 className="text-[18px] font-serif font-bold text-[#1c1410] mb-1">
              Ventas por día
            </h3>
            <p className="text-[13px] text-[#78716c] mb-6">
              Rendimiento general de ventas
            </p>
            {salesChartData.length > 0 ? (
              <AreaChart
                data={salesChartData}
                index="date"
                categories={["Ventas"]}
                colors={["orange"]}
                valueFormatter={(v) =>
                  `$${new Intl.NumberFormat("es-CO").format(v)}`
                }
                className="h-72 mt-4"
                showLegend={false}
                yAxisWidth={60}
              />
            ) : (
              <EmptyChartState title="las ventas por día" icon={LineChart} />
            )}
          </div>

          {/* ── Charts Row ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[20px] border border-[#e7e5e4] bg-white p-6 elev-sm flex flex-col">
              <h3 className="text-[18px] font-serif font-bold text-[#1c1410] mb-1">
                Horas pico de operación
              </h3>
              <p className="text-[13px] text-[#78716c] mb-6">
                Volumen de órdenes por segmento
              </p>
              <div className="flex-grow flex flex-col justify-end">
                {peakHoursData.length > 0 ? (
                  <BarChart
                    data={peakHoursData}
                    index="Hora"
                    categories={["Ordenes"]}
                    colors={["orange"]}
                    className="h-64"
                    showLegend={false}
                  />
                ) : (
                  <EmptyChartState title="las horas pico" icon={BarChart3} />
                )}
              </div>
            </div>

            <div className="rounded-[20px] border border-[#e7e5e4] bg-white p-6 elev-sm flex flex-col">
              <h3 className="text-[18px] font-serif font-bold text-[#1c1410] mb-1">
                Métodos preferidos
              </h3>
              <p className="text-[13px] text-[#78716c] mb-6">
                Distribución de pagos
              </p>
              <div className="flex-grow flex items-center justify-center">
                {paymentMethodsData.length > 0 ? (
                  <DonutChart
                    data={paymentMethodsData}
                    category="value"
                    index="name"
                    colors={["orange", "stone", "slate", "amber"]}
                    className="h-64"
                  />
                ) : (
                  <EmptyChartState title="los métodos de pago" icon={PieChart} />
                )}
              </div>
            </div>
          </div>

          {/* ── Products Chart ── */}
          <div className="rounded-[24px] border border-[#e7e5e4] bg-white p-6 elev-sm">
            <h3 className="text-[18px] font-serif font-bold text-[#1c1410] mb-1">
              Top 10 productos más vendidos
            </h3>
            <p className="text-[13px] text-[#78716c] mb-6">
              Volumen de unidades
            </p>
            {productsChartData.length > 0 ? (
              <BarChart
                data={productsChartData}
                index="name"
                categories={["Cantidad"]}
                colors={["stone"]}
                className="h-80"
                showLegend={false}
                layout="vertical"
                yAxisWidth={140}
              />
            ) : (
              <EmptyChartState title="los productos top" icon={UtensilsCrossed} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
