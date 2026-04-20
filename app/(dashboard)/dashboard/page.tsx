"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  TrendingUp,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  UtensilsCrossed,
  Printer,
  Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useSession } from "@/hooks/use-session";
import { PendingAlertBanner } from "../_components/pending-alert-banner";
import type { KpiDashboard, KpiPeriod } from "@/types/kpi";

/* ───────────── palette ─────────────
   Editorial Letterpress: paper/ink/rust.
   Rust  = #b45309 (acento)
   Ink   = #1c1410 (titulares)
   Muted = #78716c (texto secundario)
   Paper = #fdfaf6 (fondo cálido)
*/

const periodLabels: Record<KpiPeriod, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
};

const periodCompareLabel: Record<KpiPeriod, string> = {
  today: "vs ayer",
  week: "vs semana pasada",
  month: "vs mes pasado",
};

/* Formato Colombiano: 196.740 */
const fmtCOP = (cents: number) =>
  `$${new Intl.NumberFormat("es-CO").format(Math.round(cents / 100))}`;

const fmtFullCOP = (pesos: number) =>
  `$${new Intl.NumberFormat("es-CO").format(pesos)}`;

/* ───────────── Chart helpers ───────────── */

/** Ticks "bonitos" (únicos, orden descendente) para ejes Y. */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  if (max <= count) {
    return Array.from({ length: max + 1 }, (_, i) => max - i);
  }
  const roughStep = max / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  let niceStep: number;
  if (normalized < 1.5) niceStep = 1;
  else if (normalized < 3) niceStep = 2;
  else if (normalized < 7) niceStep = 5;
  else niceStep = 10;
  niceStep *= magnitude;
  const niceMax = Math.ceil(max / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = niceMax; v >= 0; v -= niceStep) ticks.push(v);
  return ticks;
}

/** $40k, $1.2M, $980 — short currency. */
function formatCurrencyShort(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `$${m >= 10 ? Math.round(m) : m.toFixed(1)}M`;
  }
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
}

const MONTHS_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

/** "15 Abr" (corto para eje X). */
function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
}

/** "lunes, 15 de abril" — formato largo para tooltip. */
function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const s = d.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Catmull-Rom → Bezier (tension 0.5) para curvas suaves sin overshoot. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
  }
  const t = 0.5;
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + ((p2.x - p0.x) * t) / 6;
    const cp1y = p1.y + ((p2.y - p0.y) * t) / 6;
    const cp2x = p2.x - ((p3.x - p1.x) * t) / 6;
    const cp2y = p2.y - ((p3.y - p1.y) * t) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** "13" → "13:00 – 14:00" */
function formatHourWindow(hour: number): string {
  const h1 = String(hour).padStart(2, "0");
  const h2 = String((hour + 1) % 24).padStart(2, "0");
  return `${h1}:00 – ${h2}:00`;
}

/* ───────────── Sub-components ───────────── */

function EmptyChartState({
  title,
  icon: Icon,
}: {
  title: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#f1eee8] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-[#a8a29e]" strokeWidth={1.5} />
      </div>
      <p className="text-[13px] text-[#78716c] italic">
        No hay actividad suficiente para mostrar {title.toLowerCase()}.
      </p>
    </div>
  );
}

function DeltaBadge({
  delta,
  compareLabel,
}: {
  delta: number | null | undefined;
  compareLabel: string;
}) {
  if (delta === null || delta === undefined) {
    return (
      <span className="flex items-center gap-1.5 text-[12px] italic text-[#a8a29e]">
        <Minus className="h-3 w-3" strokeWidth={2} />
        Sin comparativa disponible
      </span>
    );
  }
  const positive = delta > 0;
  const neutral = delta === 0;
  const color = neutral
    ? "text-[#a8a29e]"
    : positive
      ? "text-emerald-700"
      : "text-rose-600";
  const Arrow = neutral ? Minus : positive ? ArrowUp : ArrowDown;
  return (
    <span className={`flex items-center gap-1.5 text-[12px] italic ${color}`}>
      <Arrow className="h-3 w-3" strokeWidth={2.25} />
      {neutral ? "Sin cambios" : `${positive ? "+" : ""}${delta.toFixed(1)}%`} {compareLabel}
    </span>
  );
}

function KpiStat({
  label,
  value,
  children,
}: {
  label: string;
  value: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-2">
      <span className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-[0.18em]">
        {label}
      </span>
      <span className="text-[38px] font-serif font-bold text-[#1c1410] leading-none tabular-nums tracking-tight">
        {value}
      </span>
      <div className="min-h-[18px]">{children}</div>
    </div>
  );
}

function InsightPill({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full bg-[#f1eee8] px-5 py-2.5">
      <Icon className="w-4 h-4 text-[#78716c]" strokeWidth={1.75} />
      <p className="text-[13px] text-[#78716c] italic">
        {label} <span className="mx-1.5 text-[#d6d3d1]">—</span>
        <span className="not-italic font-semibold text-[#1c1410]">{value}</span>
        {detail && (
          <>
            <span className="mx-1.5 text-[#d6d3d1]">·</span>
            <span className="text-[#78716c] italic">{detail}</span>
          </>
        )}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl bg-white px-7 py-7 elev-sm ${className}`}
    >
      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h3 className="text-[22px] font-serif font-bold text-[#1c1410] leading-tight tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[13px] text-[#78716c] italic mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {eyebrow && (
          <span className="text-[10.5px] font-semibold text-[#a8a29e] uppercase tracking-[0.18em] shrink-0 mt-1.5">
            {eyebrow}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

/* ───────────── Page ───────────── */

export default function DashboardPage() {
  const { restaurantId } = useSession();
  const [period, setPeriod] = useState<KpiPeriod>("week");
  const [data, setData] = useState<KpiDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  // nowTick solo se actualiza en el interval (async → permitido).
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!restaurantId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/restaurant/${restaurantId}/kpi?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLastFetchedAt(new Date());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [restaurantId, period]);

  // Intervalo para refrescar "hace X minutos"; setState solo en callback async.
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const relativeUpdatedAt = useMemo(() => {
    if (!lastFetchedAt) return null;
    const diffSec = Math.max(
      0,
      Math.floor((nowTick - lastFetchedAt.getTime()) / 1000),
    );
    if (diffSec < 60) return "hace unos segundos";
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `hace ${mins} ${mins === 1 ? "minuto" : "minutos"}`;
    const hrs = Math.floor(mins / 60);
    return `hace ${hrs} ${hrs === 1 ? "hora" : "horas"}`;
  }, [lastFetchedAt, nowTick]);

  const eyebrowDate = useMemo(() => {
    const now = new Date();
    const str = now.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return str.toUpperCase();
  }, []);

  const compareLabel = periodCompareLabel[period];
  const eyebrowForPeriod = periodLabels[period].toUpperCase();

  const salesChartData = (data?.salesOverTime || []).map((d) => ({
    date: d.date,
    sales: Math.round(d.sales / 100),
  }));

  const paymentMethods = data?.paymentMethods || [];
  const peakHours = data?.peakHours || [];
  const peakTop =
    peakHours.length > 0
      ? [...peakHours].sort((a, b) => b.orders - a.orders)[0]
      : null;

  const topProducts = (data?.topProducts || []).slice(0, 10);

  // Derived KPI values.
  const totalSales = data?.overview.totalSales ?? 0;
  const avgTicket = data?.overview.avgTicket ?? 0;
  const orderCount = data?.overview.orderCount ?? 0;
  const avgTip = data?.overview.avgTipPercentage ?? 0;

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className="mx-auto max-w-[1400px] px-1 md:px-4 pb-16">
      {/* ── Header ── */}
      <header className="pt-2 pb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold text-[#b45309] uppercase tracking-[0.22em] mb-4">
            {eyebrowDate}
          </p>
          <h1 className="text-[44px] sm:text-[52px] leading-[1.02] font-serif font-bold text-[#1c1410] tracking-[-0.015em]">
            Resumen de{" "}
            <span className="italic text-[#b45309]">Rendimiento</span>
          </h1>
          <p className="text-[15px] text-[#78716c] italic mt-3 max-w-xl leading-relaxed">
            Reporte detallado de la experiencia de servicio y la salud
            financiera del establecimiento.
          </p>
        </div>

        <nav
          aria-label="Periodo"
          className="flex items-center gap-7 shrink-0"
        >
          {(["today", "week", "month"] as KpiPeriod[]).map((p) => {
            const active = period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`relative pb-1 text-[14px] font-medium transition-colors ${
                  active
                    ? "text-[#b45309]"
                    : "text-[#78716c] hover:text-[#1c1410]"
                }`}
              >
                {periodLabels[p]}
                <span
                  className={`absolute inset-x-0 -bottom-0.5 h-[1.5px] rounded-full bg-[#b45309] transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </header>

      <PendingAlertBanner />

      {/* ── KPI Row (editorial, sin tarjetas) ── */}
      <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 lg:divide-x lg:divide-[#e7e2da]">
        <div className="lg:pr-8">
          <KpiStat
            label="Ventas totales"
            value={
              loading ? (
                <Skel w="w-40" />
              ) : (
                <AnimatedCounter
                  target={Math.round(totalSales / 100)}
                  prefix="$"
                  duration={1500}
                />
              )
            }
          >
            {!loading && (
              <DeltaBadge
                delta={totalSales > 0 ? data?.comparison?.salesDelta : null}
                compareLabel={compareLabel}
              />
            )}
          </KpiStat>
        </div>

        <div className="lg:px-8">
          <KpiStat
            label="Ticket promedio"
            value={
              loading ? (
                <Skel w="w-32" />
              ) : (
                <AnimatedCounter
                  target={Math.round(avgTicket / 100)}
                  prefix="$"
                  duration={1500}
                />
              )
            }
          >
            {!loading && (
              <span className="flex items-center gap-1.5 text-[12px] italic text-[#78716c]">
                <Minus className="h-3 w-3" strokeWidth={2} />
                Basado en {orderCount} {orderCount === 1 ? "orden" : "órdenes"}
              </span>
            )}
          </KpiStat>
        </div>

        <div className="lg:px-8">
          <KpiStat
            label="Órdenes"
            value={
              loading ? (
                <Skel w="w-16" />
              ) : (
                <AnimatedCounter target={orderCount} duration={1500} />
              )
            }
          >
            {!loading && (
              <DeltaBadge
                delta={orderCount > 0 ? data?.comparison?.ordersDelta : null}
                compareLabel={compareLabel}
              />
            )}
          </KpiStat>
        </div>

        <div className="lg:pl-8">
          <KpiStat
            label="Propina prom."
            value={
              loading ? (
                <Skel w="w-20" />
              ) : (
                <AnimatedCounter target={Math.round(avgTip)} suffix="%" duration={1500} />
              )
            }
          >
            {!loading && (
              <span className="flex items-center gap-1.5 text-[12px] italic text-[#78716c]">
                <Minus className="h-3 w-3" strokeWidth={2} />
                Sobre subtotal de la cuenta
              </span>
            )}
          </KpiStat>
        </div>
      </div>

      {/* ── Insights Pills ── */}
      {!loading &&
        (data?.bestSeller ||
          (data?.avgDailyRevenue ?? 0) > 0 ||
          (data?.upsellConversion?.rate ?? 0) > 0) && (
          <div className="mt-10 flex flex-wrap gap-3">
            {data?.bestSeller && (
              <InsightPill
                icon={Star}
                label="Producto estrella"
                value={data.bestSeller.name}
                detail={`${data.bestSeller.quantity} ${
                  data.bestSeller.quantity === 1 ? "vendido" : "vendidos"
                }`}
              />
            )}
            {(data?.avgDailyRevenue ?? 0) > 0 && (
              <InsightPill
                icon={TrendingUp}
                label="Promedio diario"
                value={fmtCOP(data!.avgDailyRevenue)}
                detail="Estable"
              />
            )}
            {(data?.upsellConversion?.rate ?? 0) > 0 && (
              <InsightPill
                icon={Sparkles}
                label="Conversión sugeridos"
                value={`${data!.upsellConversion.rate}%`}
                detail={`${data!.upsellConversion.accepted} de ${data!.upsellConversion.offered}`}
              />
            )}
          </div>
        )}

      {/* ── Divider ── */}
      <hr className="mt-10 border-0 h-px bg-[#e7e2da]" />

      {/* ── Evolución + Métodos ── */}
      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <SectionCard
          title="Evolución de Ventas"
          subtitle="Rendimiento general del periodo"
          eyebrow={eyebrowForPeriod}
          className="lg:col-span-3"
        >
          {loading ? (
            <div className="space-y-5">
              <Skel w="w-48" h="h-10" />
              <div className="h-56 rounded-2xl bg-[#f5f2ec] animate-pulse" />
            </div>
          ) : (
            <SalesEvolutionChart
              data={salesChartData}
              total={Math.round(totalSales / 100)}
              delta={totalSales > 0 ? data?.comparison?.salesDelta : null}
              compareLabel={compareLabel}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Métodos Preferidos"
          subtitle="Distribución de pagos"
          className="lg:col-span-2"
        >
          {loading ? (
            <div className="space-y-3">
              <Skel w="w-full" h="h-20" />
              <Skel w="w-full" h="h-4" />
              <Skel w="w-full" h="h-4" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <EmptyChartState title="los métodos de pago" icon={PieChartIcon} />
          ) : (
            (() => {
              const total = paymentMethods.reduce((s, m) => s + m.count, 0);
              const sorted = [...paymentMethods].sort(
                (a, b) => b.count - a.count,
              );
              const principal = sorted[0];
              const prettyName = (n: string) =>
                n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();

              return (
                <div>
                  <p className="text-[10.5px] font-semibold text-[#a8a29e] uppercase tracking-[0.18em] mb-2">
                    {sorted.length === 1
                      ? "Único método utilizado"
                      : "Método principal"}
                  </p>
                  <p className="text-[30px] font-serif italic font-semibold text-[#1c1410] leading-none tracking-tight">
                    {prettyName(principal.method)}
                  </p>
                  <div className="flex items-baseline gap-3 mt-5">
                    <span className="text-[28px] font-serif font-bold text-[#b45309] tabular-nums leading-none">
                      {Math.round((principal.count / total) * 100)}%
                    </span>
                    <span className="text-[13px] italic text-[#78716c]">
                      {principal.count}{" "}
                      {principal.count === 1 ? "transacción" : "transacciones"}
                    </span>
                  </div>

                  {sorted.length > 1 && (
                    <ul className="mt-6 pt-5 border-t border-[#e7e2da] space-y-3">
                      {sorted.map((m) => {
                        const pct =
                          total > 0 ? Math.round((m.count / total) * 100) : 0;
                        return (
                          <li key={m.method}>
                            <div className="flex items-baseline justify-between gap-3 text-[13px]">
                              <span className="text-[#1c1410] font-medium truncate">
                                {prettyName(m.method)}
                              </span>
                              <span className="text-[#1c1410] font-semibold tabular-nums shrink-0">
                                {pct}%
                              </span>
                            </div>
                            <p className="text-[12px] italic text-[#78716c] mt-0.5">
                              {m.count === 0
                                ? "Sin transacciones"
                                : `${m.count} ${
                                    m.count === 1 ? "transacción" : "transacciones"
                                  }`}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })()
          )}
        </SectionCard>
      </div>

      {/* ── Horas Pico + Top Productos ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <SectionCard
          title="Horas Pico"
          subtitle="Volumen de órdenes por hora"
          eyebrow={eyebrowForPeriod}
          className="lg:col-span-2"
        >
          {loading ? (
            <div className="space-y-5">
              <Skel w="w-32" h="h-10" />
              <div className="h-56 rounded-2xl bg-[#f5f2ec] animate-pulse" />
            </div>
          ) : peakHours.length > 0 && peakTop ? (
            <PeakHoursChart hours={peakHours} peakHour={peakTop.hour} />
          ) : (
            <EmptyChartState title="las horas pico" icon={BarChart3} />
          )}
        </SectionCard>

        <SectionCard
          title="Top 10 Productos Más Vendidos"
          subtitle="Ranking por unidades vendidas"
          eyebrow={topProducts.length > 0 ? "RANKING" : undefined}
          className="lg:col-span-3"
        >
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skel key={i} w="w-full" h="h-8" />
              ))}
            </div>
          ) : topProducts.length > 0 ? (
            <ol className="space-y-5">
              {topProducts.map((p, i) => {
                const maxQty = topProducts[0]?.quantity || 1;
                const normalized = maxQty > 0 ? p.quantity / maxQty : 0;
                return (
                  <li key={`${p.name}-${i}`} className="group">
                    <div className="flex items-baseline gap-6">
                      <span className="w-7 shrink-0 text-[11px] font-semibold text-[#a8a29e] tabular-nums tracking-wider pt-1">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-6">
                          <p className="text-[15px] font-medium text-[#1c1410] truncate">
                            {p.name}
                          </p>
                          <p className="text-[14px] tabular-nums shrink-0">
                            <span className="font-serif font-bold text-[#1c1410]">
                              {p.quantity}
                            </span>
                            <span className="italic text-[#78716c] ml-1.5">
                              uds.
                            </span>
                          </p>
                        </div>
                        {p.revenue > 0 && (
                          <p className="text-[12px] italic text-[#78716c] mt-0.5">
                            {fmtCOP(p.revenue)} recaudados
                          </p>
                        )}
                        <div className="mt-2 h-[1.5px] bg-[#f1eee8] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#b45309] rounded-full transition-[width] duration-700 ease-out"
                            style={{ width: `${Math.max(8, normalized * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyChartState title="los productos top" icon={UtensilsCrossed} />
          )}
        </SectionCard>
      </div>

      {/* ── Footer ── */}
      <footer className="mt-12 pt-6 border-t border-[#e7e2da] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-[13px] text-[#78716c] hover:text-[#1c1410] transition-colors"
        >
          <Settings2 className="w-4 h-4" strokeWidth={1.75} />
          Configuración
        </Link>
        {relativeUpdatedAt && (
          <p className="text-[12px] italic text-[#a8a29e] text-center">
            Datos actualizados {relativeUpdatedAt} · Smart Checkout v4.2
          </p>
        )}
        <button
          type="button"
          onClick={handlePrint}
          className="group inline-flex items-center gap-2 text-[11px] font-semibold text-[#b45309] hover:text-[#9a2a02] uppercase tracking-[0.16em] transition-colors"
        >
          <Printer className="w-3.5 h-3.5" strokeWidth={2} />
          Imprimir reporte
          <span className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </button>
      </footer>
    </div>
  );
}

/* ───────────── Sales Evolution Chart ─────────────
   Editorial premium:
   - Curva suave (Catmull-Rom → Bezier).
   - Gradient rust + línea de 2px + dot destacado en el máximo.
   - Hover con tooltip (fecha + monto), guía vertical y dot móvil.
*/
function SalesEvolutionChart({
  data,
  total,
  delta,
  compareLabel,
}: {
  data: { date: string; sales: number }[];
  total: number;
  delta: number | null | undefined;
  compareLabel: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const header = (
    <div className="mb-7">
      <p className="text-[10.5px] font-semibold text-[#a8a29e] uppercase tracking-[0.18em] mb-2">
        Total recaudado
      </p>
      <div className="flex items-baseline gap-4 flex-wrap">
        <span className="text-[36px] font-serif font-bold text-[#1c1410] leading-none tabular-nums tracking-tight">
          {fmtFullCOP(total)}
        </span>
        <DeltaBadge delta={delta} compareLabel={compareLabel} />
      </div>
    </div>
  );

  if (data.length === 0) {
    return (
      <div>
        {header}
        <EmptyChartState
          title="la evolución de ventas"
          icon={LineChartIcon}
        />
      </div>
    );
  }

  // Para periodos con un solo día ("hoy") no dibujamos línea.
  if (data.length < 2) {
    return (
      <div>
        {header}
        <div className="rounded-2xl bg-[#faf6ef] px-5 py-8 text-center">
          <p className="text-[13px] italic text-[#78716c]">
            La evolución se trazará cuando haya al menos dos puntos de datos
            en el periodo.
          </p>
        </div>
      </div>
    );
  }

  const maxSales = Math.max(...data.map((d) => d.sales), 1);
  const yTicks = niceTicks(maxSales, 4);
  const yMax = yTicks[0];

  // Coordenadas en viewBox 0-100.
  const PAD_X = 2; // margen horizontal pequeño
  const xStep = (100 - PAD_X * 2) / (data.length - 1);
  const points = data.map((d, i) => ({
    x: PAD_X + i * xStep,
    y: 100 - (d.sales / yMax) * 100,
    date: d.date,
    sales: d.sales,
  }));

  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} 100 L ${points[0].x.toFixed(2)} 100 Z`;

  // Índice del máximo (dot destacado).
  let maxIdx = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i].sales > data[maxIdx].sales) maxIdx = i;
  }
  const maxPoint = points[maxIdx];
  const activePoint = hoverIdx !== null ? points[hoverIdx] : null;

  // Seleccionar hasta 6 etiquetas X distribuidas.
  const maxXLabels = 6;
  const labelIndices =
    data.length <= maxXLabels
      ? data.map((_, i) => i)
      : Array.from({ length: maxXLabels }, (_, i) =>
          Math.round((i * (data.length - 1)) / (maxXLabels - 1)),
        );

  return (
    <div>
      {header}
      <div className="relative flex gap-3 h-56">
        {/* Y axis */}
        <div className="flex flex-col justify-between pb-7 pr-2 text-[10px] text-[#a8a29e] tabular-nums shrink-0">
          {yTicks.map((v, i) => (
            <span key={`sales-y-${i}`}>{formatCurrencyShort(v)}</span>
          ))}
        </div>

        {/* Chart area */}
        <div className="relative flex-1 flex flex-col">
          {/* Grid lines */}
          <div className="absolute inset-0 pb-7 flex flex-col justify-between pointer-events-none">
            {yTicks.map((_, i) => (
              <div
                key={`sales-grid-${i}`}
                className="border-t border-[#ece7dd]"
              />
            ))}
          </div>

          {/* SVG + overlays */}
          <div
            className="relative flex-1 overflow-hidden"
            onMouseLeave={() => setHoverIdx(null)}
          >
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-full block"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b45309" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#salesGrad)" />
              <path
                d={linePath}
                stroke="#b45309"
                strokeWidth="2"
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Línea guía vertical (solo en hover) */}
            {activePoint && (
              <div
                className="absolute top-0 bottom-0 w-px bg-[#1c1410]/15 pointer-events-none"
                style={{ left: `${activePoint.x}%` }}
              />
            )}

            {/* Dot del máximo (siempre visible, semitransparente si hay hover) */}
            <div
              className={`absolute w-2 h-2 rounded-full bg-[#b45309] pointer-events-none transition-opacity ${
                activePoint && hoverIdx !== maxIdx
                  ? "opacity-40"
                  : "opacity-100"
              }`}
              style={{
                left: `${maxPoint.x}%`,
                top: `${maxPoint.y}%`,
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 0 3px rgba(180, 83, 9, 0.12)",
              }}
            />

            {/* Dot de hover */}
            {activePoint && (
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-white border-2 border-[#b45309] pointer-events-none shadow-[0_0_0_4px_rgba(180,83,9,0.15)]"
                style={{
                  left: `${activePoint.x}%`,
                  top: `${activePoint.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}

            {/* Tooltip (aparece arriba del dot, ajusta si está pegado a bordes) */}
            {activePoint && hoverIdx !== null && (
              <div
                className="absolute pointer-events-none z-10"
                style={{
                  left: `${activePoint.x}%`,
                  top: `${Math.max(activePoint.y - 4, 0)}%`,
                  transform: `translate(${
                    activePoint.x < 15
                      ? "0"
                      : activePoint.x > 85
                        ? "-100%"
                        : "-50%"
                  }, -110%)`,
                }}
              >
                <div className="rounded-lg bg-[#1c1410] text-white px-3 py-2 shadow-lg whitespace-nowrap">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#e7e2da]/70 font-medium">
                    {formatLongDate(data[hoverIdx].date)}
                  </p>
                  <p className="text-[14px] font-serif font-bold tabular-nums mt-0.5">
                    {fmtFullCOP(data[hoverIdx].sales)}
                  </p>
                </div>
              </div>
            )}

            {/* Hit-boxes invisibles para el hover (uno por punto) */}
            <div className="absolute inset-0 flex">
              {data.map((_, i) => (
                <div
                  key={`sales-hit-${i}`}
                  className="flex-1 cursor-crosshair"
                  onMouseEnter={() => setHoverIdx(i)}
                />
              ))}
            </div>
          </div>

          {/* X labels */}
          <div className="relative h-7 mt-1">
            {labelIndices.map((idx) => {
              const p = points[idx];
              const isFirst = idx === 0;
              const isLast = idx === data.length - 1;
              return (
                <span
                  key={`sales-x-${idx}`}
                  className="absolute text-[10.5px] italic text-[#a8a29e] whitespace-nowrap"
                  style={{
                    left: `${p.x}%`,
                    transform: isFirst
                      ? "translateX(0)"
                      : isLast
                        ? "translateX(-100%)"
                        : "translateX(-50%)",
                  }}
                >
                  {formatShortDate(p.date)}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Peak Hours Chart ─────────────
   Editorial premium:
   - Big number como ventana horaria ("13:00 – 14:00") en vez de "13h".
   - Línea horizontal de promedio (dashed rust) cruzando las barras.
   - Hover tooltip por barra + ventana de servicio en el subtítulo.
*/
function PeakHoursChart({
  hours,
  peakHour,
}: {
  hours: { hour: number; orders: number }[];
  peakHour: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Rellenar horas intermedias sin actividad para evitar saltos raros.
  const sortedInput = [...hours].sort((a, b) => a.hour - b.hour);
  const minH = sortedInput[0].hour;
  const maxH = sortedInput[sortedInput.length - 1].hour;
  const filled: { hour: number; orders: number }[] = [];
  for (let h = minH; h <= maxH; h++) {
    const found = sortedInput.find((x) => x.hour === h);
    filled.push(found ?? { hour: h, orders: 0 });
  }

  const maxOrders = Math.max(...filled.map((x) => x.orders), 1);
  const yTicks = niceTicks(maxOrders, 4);
  const yMax = yTicks[0];

  const peakEntry = filled.find((x) => x.hour === peakHour);
  const totalOrders = filled.reduce((s, h) => s + h.orders, 0);
  const activeHours = filled.filter((h) => h.orders > 0).length || 1;
  const avgOrders = totalOrders / activeHours;
  const avgPct = (avgOrders / yMax) * 100;

  // Etiquetas X: si hay muchas horas, mostrar solo algunas + pico + extremos.
  const showAllLabels = filled.length <= 8;

  return (
    <div>
      {/* KPI Header */}
      <div className="mb-7">
        <p className="text-[10.5px] font-semibold text-[#a8a29e] uppercase tracking-[0.18em] mb-2">
          Ventana de pico
        </p>
        <p className="text-[36px] font-serif font-bold text-[#1c1410] leading-none tabular-nums tracking-tight">
          {formatHourWindow(peakHour)}
        </p>
        <p className="text-[12px] italic text-[#78716c] mt-2">
          {peakEntry?.orders ?? 0}{" "}
          {(peakEntry?.orders ?? 0) === 1 ? "orden" : "órdenes"} en el pico ·{" "}
          Servicio de {minH}h a {maxH + 1}h
        </p>
      </div>

      {/* Chart */}
      <div className="relative flex gap-3 h-56">
        {/* Y axis */}
        <div className="flex flex-col justify-between pb-7 pr-2 text-[10px] text-[#a8a29e] tabular-nums shrink-0">
          {yTicks.map((v, i) => (
            <span key={`peak-y-${i}`}>{v}</span>
          ))}
        </div>

        {/* Chart area */}
        <div
          className="relative flex-1 flex flex-col"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 pb-7 flex flex-col justify-between pointer-events-none">
            {yTicks.map((_, i) => (
              <div
                key={`peak-grid-${i}`}
                className="border-t border-dashed border-[#ece7dd]"
              />
            ))}
          </div>

          {/* Bars */}
          <div className="relative flex-1 flex items-end justify-around gap-1.5">
            {/* Línea de promedio (dashed rust sutil cruzando las barras) */}
            {totalOrders > 0 && (
              <>
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-[#b45309]/40 pointer-events-none z-[1]"
                  style={{ bottom: `${avgPct}%` }}
                />
                <span
                  className="absolute right-0 text-[9.5px] italic text-[#b45309]/70 uppercase tracking-[0.12em] pointer-events-none z-[1] bg-white px-1"
                  style={{
                    bottom: `calc(${avgPct}% + 2px)`,
                  }}
                >
                  prom. {avgOrders.toFixed(1)}
                </span>
              </>
            )}

            {filled.map((h, i) => {
              const height = (h.orders / yMax) * 100;
              const isPeak = h.hour === peakHour;
              const isHover = i === hoverIdx;
              return (
                <div
                  key={`peak-bar-${h.hour}`}
                  className="relative flex-1 flex flex-col items-center justify-end h-full cursor-crosshair"
                  onMouseEnter={() => setHoverIdx(i)}
                >
                  <div
                    className={`w-full max-w-[26px] rounded-t-md transition-all duration-700 ease-out ${
                      isPeak
                        ? "bg-[#b45309]"
                        : isHover
                          ? "bg-[#d4a574]"
                          : "bg-[#e8d9c0]"
                    } ${h.orders === 0 ? "opacity-30" : ""}`}
                    style={{
                      height: `${Math.max(height, h.orders > 0 ? 3 : 0)}%`,
                    }}
                  />
                </div>
              );
            })}

            {/* Tooltip del hover */}
            {hoverIdx !== null && (
              <div
                className="absolute pointer-events-none z-10"
                style={{
                  left: `${((hoverIdx + 0.5) / filled.length) * 100}%`,
                  bottom: `${Math.max((filled[hoverIdx].orders / yMax) * 100, 3) + 4}%`,
                  transform: `translate(${
                    hoverIdx / filled.length < 0.15
                      ? "0"
                      : hoverIdx / filled.length > 0.85
                        ? "-100%"
                        : "-50%"
                  }, 0)`,
                }}
              >
                <div className="rounded-lg bg-[#1c1410] text-white px-3 py-2 shadow-lg whitespace-nowrap">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#e7e2da]/70 font-medium">
                    {formatHourWindow(filled[hoverIdx].hour)}
                  </p>
                  <p className="text-[14px] font-serif font-bold tabular-nums mt-0.5">
                    {filled[hoverIdx].orders}{" "}
                    <span className="text-[11px] italic font-normal text-[#e7e2da]/80">
                      {filled[hoverIdx].orders === 1 ? "orden" : "órdenes"}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* X labels */}
          <div className="h-7 flex items-center justify-around gap-1.5 mt-1">
            {filled.map((h, i) => {
              const isEdge = i === 0 || i === filled.length - 1;
              const isPeak = h.hour === peakHour;
              const show = showAllLabels || isEdge || isPeak;
              return (
                <span
                  key={`peak-x-${h.hour}`}
                  className={`flex-1 text-center text-[10px] tabular-nums ${
                    isPeak
                      ? "text-[#b45309] font-semibold"
                      : "text-[#a8a29e]"
                  }`}
                >
                  {show ? `${h.hour}h` : ""}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Loading helper ───────────── */
function Skel({ w, h = "h-10" }: { w: string; h?: string }) {
  return <div className={`${w} ${h} bg-[#f1eee8] rounded-md animate-pulse`} />;
}
