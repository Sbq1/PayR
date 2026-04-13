"use client";

import Link from "next/link";
import { motion, MotionValue } from "framer-motion";
import { ArrowRight, QrCode, Sparkles, Check } from "lucide-react";

export function Hero({
  heroY,
  heroOpacity,
}: {
  heroY: MotionValue<number>;
  heroOpacity: MotionValue<number>;
}) {
  return (
    <section className="relative pt-36 pb-24 md:pt-44 md:pb-32 overflow-hidden bg-white">
      {/* Gradient mesh background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* Top-right conic blob */}
        <div
          className="absolute -top-40 right-[-15%] h-[720px] w-[720px] rounded-full opacity-60 blur-3xl motion-safe:animate-[spin_28s_linear_infinite]"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 50%, #a5b4fc 0deg, #c4b5fd 120deg, #f0abfc 240deg, #a5b4fc 360deg)",
          }}
        />
        {/* Bottom-left soft blob */}
        <div
          className="absolute bottom-[-20%] left-[-10%] h-[560px] w-[560px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #c7d2fe 0%, #e9d5ff 40%, transparent 70%)",
          }}
        />
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgb(17 24 39 / 0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 60% 60% at 50% 40%, black 40%, transparent 80%)",
          }}
        />
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
          <div className="relative flex items-center justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="relative w-full max-w-[360px]"
            >
              {/* Floating notification — top */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="absolute -top-4 -left-8 z-20 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md p-3 shadow-[0_12px_40px_-12px_rgba(79,70,229,0.35)] hidden sm:flex items-center gap-3 w-[230px]"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shrink-0">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 truncate">
                    Pago recibido
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Mesa 05 · $84.500
                  </p>
                </div>
              </motion.div>

              {/* Floating notification — bottom right */}
              <motion.div
                initial={{ opacity: 0, x: -20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="absolute -bottom-6 -right-4 z-20 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md px-3.5 py-2.5 shadow-[0_12px_40px_-12px_rgba(192,38,211,0.3)] hidden sm:flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />
                <p className="text-[12px] font-medium text-gray-900">
                  Mesa cerrada automáticamente
                </p>
              </motion.div>

              {/* Phone frame */}
              <div className="relative mx-auto w-[300px] h-[600px] rounded-[44px] bg-gray-900 p-3 shadow-[0_40px_80px_-20px_rgba(79,70,229,0.4),0_20px_40px_-16px_rgba(0,0,0,0.2)]">
                <div className="relative h-full w-full rounded-[32px] bg-white overflow-hidden flex flex-col">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pt-3 pb-2 text-[11px] font-medium text-gray-900">
                    <span>9:41</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-gray-900" />
                      <span className="w-1 h-1 rounded-full bg-gray-900" />
                      <span className="w-1 h-1 rounded-full bg-gray-900" />
                    </span>
                  </div>

                  {/* Restaurant header */}
                  <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white text-[11px] font-bold">
                        LB
                      </div>
                      <span className="text-[13px] font-semibold text-gray-900">
                        La Barra
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                      Mesa 05
                    </span>
                  </div>

                  {/* Bill items */}
                  <div className="flex-1 px-6 py-4 space-y-2.5">
                    {[
                      { name: "Hamburguesa", qty: 2, total: "$56.000" },
                      { name: "Cerveza artesanal", qty: 3, total: "$27.000" },
                      { name: "Postre casa", qty: 1, total: "$15.000" },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-[12px]"
                      >
                        <span className="text-gray-900">
                          {item.qty}× {item.name}
                        </span>
                        <span className="text-gray-600 tabular-nums">
                          {item.total}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* QR section */}
                  <div className="px-6 pb-6 pt-3 border-t border-gray-100 flex flex-col items-center">
                    <div className="relative w-[132px] h-[132px] rounded-2xl border border-gray-200 bg-white p-3 mb-3">
                      <QrCode className="w-full h-full text-gray-900" strokeWidth={1.5} />
                      {/* Scan line */}
                      <motion.div
                        animate={{ y: [0, 106, 0] }}
                        transition={{
                          duration: 2.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute left-3 right-3 top-3 h-[2px] rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                      />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">
                      Total a pagar
                    </p>
                    <p className="text-[22px] font-bold text-gray-900 tabular-nums">
                      $84.500
                    </p>
                  </div>
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
