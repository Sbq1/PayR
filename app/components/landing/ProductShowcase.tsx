"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  ArrowUp,
  Users,
  QrCode,
  BellRing,
} from "lucide-react";

export function ProductShowcase() {
  return (
    <section className="relative bg-gray-50 py-24 md:py-32 border-t border-gray-100 overflow-hidden grain">
      {/* Backdrop gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 100%, rgb(192 132 252 / 0.12) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-[720px] mb-14"
        >
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em] block mb-4">
            El producto
          </span>
          <h2 className="text-[36px] md:text-[52px] font-[900] tracking-[-0.03em] leading-[1.05] text-gray-900">
            Hecho para operar,
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              no para mirar.
            </span>
          </h2>
          <p className="text-[17px] text-gray-600 mt-5 leading-relaxed max-w-[560px]">
            Dashboard en vivo, experiencia de cliente pulida, y alertas
            que importan. Todo sobre la stack que ya usás.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-5 [perspective:1600px]">
          {/* Card 1 — Dashboard (span 4) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="md:col-span-4 relative rounded-3xl border border-gray-200 bg-white overflow-hidden group tilt-card"
          >
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span className="text-[12px] font-semibold text-indigo-500 uppercase tracking-wide">
                  Dashboard en vivo
                </span>
              </div>
              <h3 className="text-[24px] md:text-[30px] font-bold text-gray-900 tracking-tight mb-3">
                Ves cada pago en el momento exacto.
              </h3>
              <p className="text-[15px] text-gray-500 leading-relaxed max-w-[460px]">
                Ventas, órdenes, métodos de pago y mesas activas actualizadas
                sin refrescar. Tremor charts, datos reales de tu Supabase.
              </p>
            </div>

            {/* Dashboard mockup */}
            <div className="relative px-6 md:px-10 pb-0 pt-2">
              <div className="relative rounded-t-2xl border border-gray-200 border-b-0 bg-white overflow-hidden shadow-[0_20px_40px_-20px_rgba(99,102,241,0.2)]">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="ml-2 text-[11px] font-medium text-gray-900">
                      Dashboard · La Barra
                    </span>
                  </div>
                  <div className="flex gap-3 text-[10px] font-medium text-gray-400">
                    <span>Hoy</span>
                    <span>Semana</span>
                    <span className="text-gray-900">Mes</span>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Ventas", value: "$4.8M", delta: "+12%", up: true },
                    { label: "Órdenes", value: "243", delta: "+8%", up: true },
                    { label: "Ticket prom.", value: "$19.7k", delta: "−2%", up: false },
                    { label: "Propina", value: "8.4%", delta: "+1%", up: true },
                  ].map((kpi, i) => (
                    <motion.div
                      key={kpi.label}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
                      className="rounded-lg border border-gray-100 bg-gray-50/50 p-3"
                    >
                      <p className="text-[9px] uppercase tracking-wide text-gray-400 mb-1">
                        {kpi.label}
                      </p>
                      <p className="text-[16px] font-bold text-gray-900 tabular-nums">
                        {kpi.value}
                      </p>
                      <p
                        className={`text-[9px] font-semibold mt-0.5 flex items-center gap-0.5 ${
                          kpi.up ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        <ArrowUp
                          className={`w-2.5 h-2.5 ${kpi.up ? "" : "rotate-180"}`}
                          strokeWidth={3}
                        />
                        {kpi.delta}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Chart */}
                <div className="px-5 pb-5">
                  <SparklineChart />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2 — QR experience (span 2) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-2 relative rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-8 overflow-hidden min-h-[400px] tilt-card tilt-card-invert"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="w-4 h-4 text-white/90" />
                <span className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
                  QR por mesa
                </span>
              </div>
              <h3 className="text-[22px] md:text-[26px] font-bold text-white tracking-tight mb-3 leading-tight">
                El cliente paga desde su propio teléfono.
              </h3>
              <p className="text-[14px] text-white/80 leading-relaxed">
                Sin apps. Sin cuentas. Escanea y listo.
              </p>
            </div>

            {/* Floating QR */}
            <div className="absolute -bottom-6 -right-6 w-[220px] rotate-6">
              <div className="rounded-2xl bg-white p-5 shadow-2xl">
                <div className="w-full aspect-square rounded-lg bg-white border border-gray-200 p-3 mb-3">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect width="100" height="100" fill="white" />
                    {[[0, 0], [0, 70], [70, 0]].map(([x, y]) => (
                      <g key={`${x}-${y}`}>
                        <rect x={x + 2} y={y + 2} width="26" height="26" fill="#111827" />
                        <rect x={x + 6} y={y + 6} width="18" height="18" fill="white" />
                        <rect x={x + 10} y={y + 10} width="10" height="10" fill="#111827" />
                      </g>
                    ))}
                    {Array.from({ length: 80 }).map((_, i) => {
                      const col = i % 12;
                      const row = Math.floor(i / 12);
                      const x = col * 5 + 32;
                      const y = row * 5 + 32;
                      if (y > 94 || x > 94) return null;
                      return (
                        <rect
                          key={i}
                          x={x}
                          y={y}
                          width="3"
                          height="3"
                          fill={i % 3 === 0 ? "#111827" : "transparent"}
                        />
                      );
                    })}
                  </svg>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center mb-0.5">
                  Mesa 05
                </p>
                <p className="text-[16px] font-bold text-gray-900 text-center tabular-nums">
                  $84.500
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 3 — Alertas (span 3) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-3 relative rounded-3xl border border-gray-200 bg-white p-8 md:p-10 overflow-hidden min-h-[360px] tilt-card"
          >
            <div className="flex items-center gap-2 mb-4">
              <BellRing className="w-4 h-4 text-fuchsia-500" />
              <span className="text-[12px] font-semibold text-fuchsia-500 uppercase tracking-wide">
                Alertas en tiempo real
              </span>
            </div>
            <h3 className="text-[24px] md:text-[28px] font-bold text-gray-900 tracking-tight mb-3">
              Nada pasa sin que lo sepas.
            </h3>
            <p className="text-[15px] text-gray-500 leading-relaxed mb-6 max-w-[420px]">
              Pagos, fallas del POS, upsells aceptados. Se notifican
              directo en el dashboard.
            </p>

            {/* Stack de notificaciones */}
            <div className="space-y-2.5 max-w-[460px]">
              {[
                {
                  icon: "✓",
                  title: "Pago recibido",
                  sub: "Mesa 05 · $84.500 · Nequi",
                  tone: "emerald",
                },
                {
                  icon: "↗",
                  title: "Upsell aceptado",
                  sub: "Mesa 03 · Postre (+$12.000)",
                  tone: "fuchsia",
                },
                {
                  icon: "⟳",
                  title: "POS reconectado",
                  sub: "Siigo · hace 4s",
                  tone: "gray",
                },
              ].map((n, i) => (
                <motion.div
                  key={n.title}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold text-white ${
                      n.tone === "emerald"
                        ? "bg-emerald-500"
                        : n.tone === "fuchsia"
                          ? "bg-fuchsia-500"
                          : "bg-gray-500"
                    }`}
                  >
                    {n.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-gray-900">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-gray-500">{n.sub}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {i === 0 ? "hace 2s" : i === 1 ? "hace 18s" : "hace 4s"}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Card 4 — Multi-user (span 3) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-3 relative rounded-3xl border border-gray-200 bg-gray-900 p-8 md:p-10 overflow-hidden min-h-[360px] tilt-card tilt-card-invert"
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-[12px] font-semibold text-emerald-400 uppercase tracking-wide">
                Multi-dispositivo
              </span>
            </div>
            <h3 className="text-[24px] md:text-[28px] font-bold text-white tracking-tight mb-3">
              Todos conectados al mismo dashboard.
            </h3>
            <p className="text-[15px] text-gray-400 leading-relaxed mb-6 max-w-[380px]">
              Admin desde el bar, meseros desde el móvil, cocina desde la
              tablet. Mismo estado, siempre.
            </p>

            {/* Device stack visual */}
            <div className="relative h-[180px]">
              <motion.div
                initial={{ opacity: 0, y: 20, rotate: -8 }}
                whileInView={{ opacity: 1, y: 0, rotate: -4 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute bottom-0 left-0 w-[150px] h-[160px] rounded-xl bg-gray-800 border border-gray-700 p-3"
              >
                <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-2">
                  Admin
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 rounded bg-gray-700" />
                  <div className="h-2 rounded bg-gray-700 w-3/4" />
                  <div className="h-8 rounded bg-gradient-to-r from-indigo-500/40 to-fuchsia-500/40 mt-3" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="absolute bottom-4 left-[120px] w-[170px] h-[170px] rounded-xl bg-gray-800 border border-gray-700 p-3 z-10"
              >
                <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-2">
                  Mesero · Tablet
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded ${
                        i === 2 || i === 5
                          ? "bg-amber-500/30"
                          : i === 7
                            ? "bg-blue-500/30"
                            : "bg-emerald-500/20"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20, rotate: 8 }}
                whileInView={{ opacity: 1, y: 0, rotate: 4 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="absolute bottom-6 right-0 w-[100px] h-[150px] rounded-2xl bg-gray-800 border border-gray-700 p-2"
              >
                <div className="text-[8px] text-gray-500 uppercase tracking-wide mb-1.5">
                  Móvil
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 rounded bg-gray-700" />
                  <div className="h-1.5 rounded bg-gray-700 w-2/3" />
                  <div className="h-16 rounded bg-gradient-to-br from-emerald-500/30 to-teal-500/30 mt-2" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Mini sparkline chart ─────────────────────────────────────────

function SparklineChart() {
  const points = [20, 35, 28, 45, 38, 52, 48, 65, 58, 70, 68, 82];
  const max = Math.max(...points);
  const w = 100 / (points.length - 1);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * w} ${100 - (p / max) * 100}`)
    .join(" ");

  const fillPath = `${path} L ${(points.length - 1) * w} 100 L 0 100 Z`;

  return (
    <div className="relative w-full h-[80px]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="chart-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
        <motion.path
          d={fillPath}
          fill="url(#chart-fill)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        <motion.path
          d={path}
          stroke="url(#chart-line)"
          strokeWidth="1.5"
          fill="none"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        />
      </svg>
    </div>
  );
}
