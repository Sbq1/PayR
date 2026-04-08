"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, AreaChart, DonutChart } from "@tremor/react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import type { KpiDashboard, KpiPeriod } from "@/types/kpi";

export default function DashboardPage() {
  const [period, setPeriod] = useState<KpiPeriod>("month");
  const [data, setData] = useState<KpiDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (session?.restaurantId) {
          setRestaurantId(session.restaurantId);
        }
      });
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    fetch(`/api/restaurant/${restaurantId}/kpi?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [restaurantId, period]);

  const kpiCards = [
    {
      title: "Ventas",
      rawValue: data?.overview.totalSales ?? 0,
      prefix: "$",
      suffix: "",
      isCurrency: true,
      delta: data?.comparison?.salesDelta ?? 0,
    },
    {
      title: "Ordenes",
      rawValue: data?.overview.orderCount ?? 0,
      prefix: "",
      suffix: "",
      isCurrency: false,
      delta: data?.comparison?.ordersDelta ?? 0,
    },
    {
      title: "Ticket promedio",
      rawValue: data?.overview.avgTicket ?? 0,
      prefix: "$",
      suffix: "",
      isCurrency: true,
      delta: null,
    },
    {
      title: "Propina prom.",
      rawValue: data?.overview.avgTipPercentage ?? 0,
      prefix: "",
      suffix: "%",
      isCurrency: false,
      delta: null,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[15px] font-semibold text-gray-900">Dashboard</h1>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as KpiPeriod)}
        >
          <TabsList>
            <TabsTrigger value="today">Hoy</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <Card key={kpi.title}>
                <CardContent className="pt-4">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                    {kpi.title}
                  </p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-2xl font-semibold text-gray-900">
                      <AnimatedCounter
                        target={kpi.isCurrency ? Math.round(kpi.rawValue / 100) : kpi.rawValue}
                        prefix={kpi.prefix}
                        suffix={kpi.suffix}
                        duration={1500}
                      />
                    </span>
                    {kpi.delta !== null && kpi.delta !== 0 && (
                      <span
                        className={`flex items-center gap-0.5 text-[11px] font-medium pb-0.5 ${
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Best seller + insights */}
          {data?.bestSeller && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-gray-500">
              <p>
                Plato estrella:{" "}
                <span className="font-medium text-gray-900">
                  {data.bestSeller.name}
                </span>{" "}
                — {data.bestSeller.quantity} vendidos
              </p>
              {data.avgDailyRevenue > 0 && (
                <p>
                  Promedio diario:{" "}
                  <span className="font-medium text-gray-900">
                    ${new Intl.NumberFormat("es-CO").format(Math.round(data.avgDailyRevenue / 100))}
                  </span>
                </p>
              )}
              {data.upsellConversion.rate > 0 && (
                <p>
                  Conversión sugeridos:{" "}
                  <span className="font-medium text-gray-900">
                    {data.upsellConversion.rate}%
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Charts Row 1 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-[13px] font-medium text-gray-500">
                  Ventas por día
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesChartData.length > 0 ? (
                  <AreaChart
                    data={salesChartData}
                    index="date"
                    categories={["Ventas"]}
                    colors={["gray"]}
                    valueFormatter={(v) =>
                      `$${new Intl.NumberFormat("es-CO").format(v)}`
                    }
                    className="h-52"
                    showLegend={false}
                  />
                ) : (
                  <p className="text-[13px] text-gray-400 text-center py-12">
                    Sin datos para este periodo
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[13px] font-medium text-gray-500">
                  Horas pico
                </CardTitle>
              </CardHeader>
              <CardContent>
                {peakHoursData.length > 0 ? (
                  <BarChart
                    data={peakHoursData}
                    index="Hora"
                    categories={["Ordenes"]}
                    colors={["gray"]}
                    className="h-52"
                    showLegend={false}
                  />
                ) : (
                  <p className="text-[13px] text-gray-400 text-center py-12">
                    Sin datos para este periodo
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-[13px] font-medium text-gray-500">
                  Productos más vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productsChartData.length > 0 ? (
                  <BarChart
                    data={productsChartData}
                    index="name"
                    categories={["Cantidad"]}
                    colors={["gray"]}
                    className="h-52"
                    showLegend={false}
                    layout="vertical"
                  />
                ) : (
                  <p className="text-[13px] text-gray-400 text-center py-12">
                    Sin datos para este periodo
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[13px] font-medium text-gray-500">
                  Métodos de pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethodsData.length > 0 ? (
                  <DonutChart
                    data={paymentMethodsData}
                    category="value"
                    index="name"
                    colors={["slate", "gray", "zinc", "neutral", "stone"]}
                    className="h-52"
                  />
                ) : (
                  <p className="text-[13px] text-gray-400 text-center py-12">
                    Sin datos para este periodo
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
