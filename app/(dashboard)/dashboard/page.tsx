"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, AreaChart, DonutChart } from "@tremor/react";
import {
  DollarSign,
  Receipt,
  TrendingUp,
  Percent,
  Loader2,
} from "lucide-react";
import { formatCOP } from "@/lib/utils/currency";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import type { KpiDashboard, KpiPeriod } from "@/types/kpi";

const kpiAccents = ["kpi-indigo", "kpi-cyan", "kpi-amber", "kpi-emerald"];

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
      icon: DollarSign,
    },
    {
      title: "Ordenes",
      rawValue: data?.overview.orderCount ?? 0,
      prefix: "",
      suffix: "",
      isCurrency: false,
      icon: Receipt,
    },
    {
      title: "Ticket promedio",
      rawValue: data?.overview.avgTicket ?? 0,
      prefix: "$",
      suffix: "",
      isCurrency: true,
      icon: TrendingUp,
    },
    {
      title: "Propina prom.",
      rawValue: data?.overview.avgTipPercentage ?? 0,
      prefix: "",
      suffix: "%",
      isCurrency: false,
      icon: Percent,
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
      <div className="flex items-center justify-between fade-in-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Métricas de tu restaurante</p>
        </div>
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

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <>
          {/* KPI Cards with animated counters */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi, i) => (
              <Card
                key={kpi.title}
                className={`${kpiAccents[i]} hover-lift card-appear`}
                style={{ "--delay": `${i * 0.08}s` } as React.CSSProperties}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <kpi.icon className="h-4 w-4 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <AnimatedCounter
                      target={kpi.isCurrency ? Math.round(kpi.rawValue / 100) : kpi.rawValue}
                      prefix={kpi.prefix}
                      suffix={kpi.suffix}
                      duration={2000}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="card-appear hover-lift" style={{ "--delay": "0.32s" } as React.CSSProperties}>
              <CardHeader>
                <CardTitle>Ventas por dia</CardTitle>
              </CardHeader>
              <CardContent>
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
                  <p className="text-sm text-muted-foreground text-center py-12">
                    Sin datos para este periodo
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="card-appear hover-lift" style={{ "--delay": "0.4s" } as React.CSSProperties}>
              <CardHeader>
                <CardTitle>Métodos de pago</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethodsData.length > 0 ? (
                  <DonutChart
                    data={paymentMethodsData}
                    category="value"
                    index="name"
                    colors={["indigo", "cyan", "amber", "emerald", "rose"]}
                    className="h-56"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    Sin datos para este periodo
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="card-appear hover-lift" style={{ "--delay": "0.48s" } as React.CSSProperties}>
              <CardHeader>
                <CardTitle>Productos más vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                {productsChartData.length > 0 ? (
                  <BarChart
                    data={productsChartData}
                    index="name"
                    categories={["Cantidad"]}
                    colors={["indigo"]}
                    className="h-56"
                    showLegend={false}
                    layout="vertical"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    Sin datos para este periodo
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="card-appear hover-lift" style={{ "--delay": "0.56s" } as React.CSSProperties}>
              <CardHeader>
                <CardTitle>Horas pico</CardTitle>
              </CardHeader>
              <CardContent>
                {peakHoursData.length > 0 ? (
                  <BarChart
                    data={peakHoursData}
                    index="Hora"
                    categories={["Ordenes"]}
                    colors={["amber"]}
                    className="h-56"
                    showLegend={false}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">
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
