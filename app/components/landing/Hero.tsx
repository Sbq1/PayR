"use client";

import Link from "next/link";
import { motion, MotionValue } from "framer-motion";
import { ArrowRight, Sparkles, Check, Lock, ChevronRight } from "lucide-react";
import { ParticleField } from "./ParticleField";

export function Hero({
  heroY,
  heroOpacity,
  phoneY,
  meshY,
}: {
  heroY: MotionValue<number>;
  heroOpacity: MotionValue<number>;
  phoneY: MotionValue<number>;
  meshY: MotionValue<number>;
}) {
  return (
    <section className="relative pt-36 pb-24 md:pt-44 md:pb-32 overflow-hidden bg-white grain">
      {/* Animated aurora mesh background — parallax */}
      <motion.div
        aria-hidden="true"
        style={{ y: meshY }}
        className="pointer-events-none absolute inset-0 -z-10 aurora"
      />
      {/* Spinning conic accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-15%] h-[720px] w-[720px] rounded-full opacity-50 blur-3xl motion-safe:animate-[spin_32s_linear_infinite] -z-10"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, #a5b4fc 0deg, #c4b5fd 120deg, #f0abfc 240deg, #a5b4fc 360deg)",
        }}
      />
      {/* Dot grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.3]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(17 24 39 / 0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 40%, black 40%, transparent 80%)",
        }}
      />
      {/* Canvas particle network */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
      >
        <ParticleField count={50} connectDistance={130} className="w-full h-full" />
      </div>

      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="max-w-[1280px] mx-auto px-6"
      >
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-12 items-center">
          {/* LEFT — copy + CTAs */}
          <div className="flex flex-col items-start text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-7"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-1 text-[12px] font-medium text-gray-700 shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Disponible en Colombia · Powered by Wompi
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-[44px] sm:text-[56px] md:text-[72px] lg:text-[80px] font-[900] tracking-[-0.04em] leading-[0.95] text-gray-900 mb-6"
            >
              Cobra en la mesa,
              <br />
              sin terminal,
              <br />
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                en 30 segundos.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-[17px] md:text-[19px] text-gray-600 max-w-[540px] leading-relaxed mb-9"
            >
              Clientes escanean, ven la cuenta, pagan, se van. Sin hardware
              nuevo, sin entrenar meseros. Ves cada pago en tiempo real.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-[15px] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              >
                Empezar gratis
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#historia"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-[15px] font-semibold text-gray-900 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              >
                Ver cómo funciona
              </a>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-gray-600"
            >
              {["Setup en 5 minutos", "Sin cargo mensual inicial", "Integra tu POS"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    {item}
                  </li>
                ),
              )}
            </motion.ul>
          </div>

          {/* RIGHT — phone mockup with floating notifications */}
          <div className="relative flex items-center justify-center lg:justify-end tilt-stage">
            {/* Orbiting decorative dots */}
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
              <span className="absolute top-[15%] left-[8%] w-2.5 h-2.5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 blur-[1px] float-a opacity-80" />
              <span className="absolute top-[30%] right-[5%] w-3.5 h-3.5 rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-500 blur-[1px] float-b opacity-70" />
              <span className="absolute bottom-[20%] left-[10%] w-2 h-2 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 blur-[1px] float-c opacity-70" />
              <span className="absolute bottom-[10%] right-[12%] w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 blur-sm float-a opacity-60" style={{ animationDelay: "1.5s" }} />
              <span className="absolute top-[8%] right-[22%] w-1.5 h-1.5 rounded-full bg-indigo-500 float-c opacity-80" style={{ animationDelay: "2.5s" }} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              style={{ y: phoneY }}
              className="relative w-full max-w-[360px] tilt-phone-right"
            >
              {/* Floating notification — top (safely above phone) */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="absolute -top-12 -left-14 z-20 rounded-xl border border-white/70 bg-white/95 backdrop-blur-xl p-3 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] hidden sm:flex items-center gap-3 w-[240px]"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shrink-0 shadow-sm">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-gray-900 truncate">
                    Pago recibido
                  </p>
                  <p className="text-[10.5px] text-gray-500 tabular-nums">
                    Mesa 05 · Nequi · $107.800
                  </p>
                </div>
                <span className="text-[9px] text-gray-400 shrink-0 tabular-nums">2s</span>
              </motion.div>

              {/* Floating notification — bottom right */}
              <motion.div
                initial={{ opacity: 0, x: -20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="absolute -bottom-4 -right-10 z-20 rounded-xl border border-white/70 bg-white/95 backdrop-blur-xl px-3.5 py-2.5 shadow-[0_20px_50px_-15px_rgba(192,38,211,0.35)] hidden sm:flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />
                <p className="text-[12px] font-medium text-gray-900">
                  Mesa cerrada
                </p>
              </motion.div>

              {/* Phone frame — layered shadows for depth */}
              <div
                className="relative mx-auto w-[310px] h-[640px] rounded-[48px] bg-gradient-to-br from-gray-800 via-gray-900 to-black p-[10px]"
                style={{
                  boxShadow:
                    "0 60px 120px -30px rgba(79,70,229,0.45), 0 30px 60px -20px rgba(0,0,0,0.25), inset 0 0 0 2px rgba(255,255,255,0.05)",
                }}
              >
                {/* Screen */}
                <div className="relative h-full w-full rounded-[38px] bg-white overflow-hidden flex flex-col">
                  {/* Dynamic island */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-[92px] h-[26px] rounded-full bg-black" />

                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pt-3.5 pb-2 text-[11px] font-semibold text-gray-900 z-20 relative">
                    <span>9:41</span>
                    <span className="flex items-center gap-[3px]">
                      {/* Signal */}
                      <span className="flex items-end gap-[1.5px] h-2.5">
                        <span className="w-[2.5px] h-[4px] rounded-[1px] bg-gray-900" />
                        <span className="w-[2.5px] h-[6px] rounded-[1px] bg-gray-900" />
                        <span className="w-[2.5px] h-[8px] rounded-[1px] bg-gray-900" />
                        <span className="w-[2.5px] h-[10px] rounded-[1px] bg-gray-900" />
                      </span>
                      {/* Wifi */}
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none" className="ml-0.5">
                        <path d="M6 8a1 1 0 100-2 1 1 0 000 2z" fill="#111827" />
                        <path d="M2.5 4.5a5 5 0 017 0" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                        <path d="M0.5 2.5a8 8 0 0111 0" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                      </svg>
                      {/* Battery */}
                      <span className="flex items-center ml-1">
                        <span className="relative w-6 h-2.5 rounded-[3px] border border-gray-900/80 flex items-center">
                          <span className="absolute inset-[1.5px] rounded-[1.5px] bg-gray-900" style={{ width: "75%" }} />
                        </span>
                        <span className="w-[1.5px] h-[4px] rounded-r-sm bg-gray-900/60 ml-[1px]" />
                      </span>
                    </span>
                  </div>

                  {/* Safari-style URL bar */}
                  <div className="px-4 pt-5 pb-2.5">
                    <div className="flex items-center gap-1.5 rounded-[10px] bg-gray-100 px-3 py-1.5">
                      <Lock className="w-3 h-3 text-gray-500 shrink-0" strokeWidth={2.5} />
                      <span className="text-[10.5px] text-gray-600 font-medium truncate">
                        smart-checkout.co/la-barra/m05
                      </span>
                    </div>
                  </div>

                  {/* Dark brand header */}
                  <div className="mx-3 mb-3 relative rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-60"
                      style={{
                        background:
                          "radial-gradient(ellipse 80% 80% at 85% 0%, rgba(139,92,246,0.35) 0%, transparent 60%), radial-gradient(ellipse 70% 80% at 10% 100%, rgba(236,72,153,0.28) 0%, transparent 60%)",
                      }}
                    />
                    <div className="relative px-4 py-3 flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-violet-400 to-fuchsia-400" />
                        <div className="absolute inset-0 flex items-center justify-center text-white font-black text-[13px] tracking-tighter">
                          LB
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-white leading-tight">
                          La Barra
                        </p>
                        <p className="text-[10.5px] text-white/60 flex items-center gap-1 mt-0.5">
                          <span className="inline-block w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          Mesa 05 · 3 personas
                        </p>
                      </div>
                      <span className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">
                        #2847
                      </span>
                    </div>
                  </div>

                  {/* Bill items (compact) */}
                  <div className="px-4 pb-3 space-y-2">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Tu cuenta
                    </p>
                    {[
                      { name: "Hamburguesa artesanal", qty: 2, total: "$56.000" },
                      { name: "Cerveza Club", qty: 3, total: "$27.000" },
                      { name: "Postre de la casa", qty: 1, total: "$15.000" },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-gray-800 flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold tabular-nums">
                            {item.qty}
                          </span>
                          {item.name}
                        </span>
                        <span className="text-gray-900 tabular-nums font-semibold">
                          {item.total}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-[10.5px] pt-2 border-t border-dashed border-gray-200">
                      <span className="text-gray-500">Propina (10%)</span>
                      <span className="text-gray-700 tabular-nums font-medium">$9.800</span>
                    </div>
                  </div>

                  {/* Payment chips */}
                  <div className="px-4 pb-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Método
                    </p>
                    <div className="flex gap-1.5">
                      {[
                        { label: "Nequi", active: true, color: "bg-fuchsia-500" },
                        { label: "Daviplata", active: false, color: "bg-red-500" },
                        { label: "Tarjeta", active: false, color: "bg-gray-900" },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className={`flex-1 rounded-lg border py-1.5 flex items-center justify-center gap-1 text-[10px] font-bold ${
                            m.active
                              ? "border-violet-500 bg-violet-50 text-violet-700"
                              : "border-gray-200 text-gray-500"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${m.color}`} />
                          {m.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total row with big gradient number */}
                  <div className="px-4 pb-3 flex items-baseline justify-between pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                      Total
                    </span>
                    <span className="text-[26px] font-[900] tabular-nums tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                      $107.800
                    </span>
                  </div>

                  {/* Pay CTA with shine */}
                  <div className="px-4 pb-3">
                    <button
                      className="group relative w-full py-3 rounded-2xl overflow-hidden shine-sweep"
                      style={{
                        boxShadow:
                          "0 10px 30px -8px rgba(139,92,246,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
                      <span className="relative flex items-center justify-center gap-1.5 text-white text-[13px] font-bold">
                        Pagar $107.800
                        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                      </span>
                    </button>
                  </div>

                  {/* Trust row */}
                  <div className="px-4 pb-4 flex items-center justify-center gap-1.5">
                    <Lock className="w-2.5 h-2.5 text-gray-400" strokeWidth={2.5} />
                    <p className="text-center text-[9px] text-gray-400 font-medium tracking-wide">
                      Seguro · Powered by Wompi
                    </p>
                  </div>

                  {/* Home indicator */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[110px] h-[4px] rounded-full bg-gray-900/80" />
                </div>
              </div>

              {/* Decorative soft ring behind phone */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 flex items-center justify-center"
              >
                <div className="w-[420px] h-[420px] rounded-full bg-gradient-to-br from-indigo-200/60 via-violet-200/40 to-fuchsia-200/50 blur-2xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
