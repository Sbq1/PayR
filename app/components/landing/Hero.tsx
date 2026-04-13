"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Lock, ChevronRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-36 pb-24 md:pt-44 md:pb-32 overflow-hidden bg-[#f9f9ff]">
      {/* Subtle radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(70,72,212,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT — copy + CTAs */}
          <div className="flex flex-col items-start text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-7"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e1e0ff] px-4 py-1.5 text-[11px] font-bold text-[#07006c] uppercase tracking-wider">
                Revolución en Pagos
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-[var(--font-manrope)] text-[44px] sm:text-[56px] md:text-[72px] lg:text-[80px] font-extrabold tracking-[-0.03em] leading-[1.05] text-[#141b2b] mb-6"
            >
              Cobros más rápidos,
              <br />
              operación{" "}
              <span className="bg-gradient-to-r from-[#4648d4] to-[#6b38d4] bg-clip-text text-transparent">
                más simple
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-[17px] md:text-[19px] text-[#464554] max-w-[540px] leading-relaxed mb-9"
            >
              Smart Checkout transforma tu punto de venta en una experiencia
              digital sin fricciones. Elimina hardware costoso y acelera tus
              transacciones.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold text-white bg-gradient-to-br from-[#4648d4] to-[#6063ee] hover:opacity-90 transition-all active:scale-[0.98] shadow-[0_8px_24px_-12px_rgba(70,72,212,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4648d4] focus-visible:ring-offset-2"
              >
                Prueba Gratis 14 Días
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#historia"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold text-[#4648d4] bg-[#e1e8fd] hover:bg-[#dce2f7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4648d4] focus-visible:ring-offset-2"
              >
                Ver Demostración
              </a>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[#464554]"
            >
              {["Setup en 5 minutos", "Sin hardware adicional", "Integra tu POS"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    {item}
                  </li>
                ),
              )}
            </motion.ul>
          </div>

          {/* RIGHT — phone mockup */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="relative w-full max-w-[360px]"
            >
              {/* Floating notification — payment received */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="absolute -top-10 -left-12 z-20 rounded-2xl bg-white p-3 shadow-[0_20px_40px_rgba(20,27,43,0.05)] hidden sm:flex items-center gap-3 w-[230px]"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-[#141b2b]">
                    Pago recibido
                  </p>
                  <p className="text-[10.5px] text-[#767586] tabular-nums">
                    Mesa 05 · Nequi · $107.800
                  </p>
                </div>
              </motion.div>

              {/* Phone frame */}
              <div
                className="relative mx-auto w-[310px] h-[640px] rounded-[48px] bg-gradient-to-br from-gray-800 via-gray-900 to-black p-[10px]"
                style={{
                  boxShadow:
                    "0 60px 120px -30px rgba(70,72,212,0.3), 0 30px 60px -20px rgba(0,0,0,0.2)",
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
                      <span className="flex items-end gap-[1.5px] h-2.5">
                        <span className="w-[2.5px] h-[4px] rounded-[1px] bg-gray-900" />
                        <span className="w-[2.5px] h-[6px] rounded-[1px] bg-gray-900" />
                        <span className="w-[2.5px] h-[8px] rounded-[1px] bg-gray-900" />
                        <span className="w-[2.5px] h-[10px] rounded-[1px] bg-gray-900" />
                      </span>
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none" className="ml-0.5">
                        <path d="M6 8a1 1 0 100-2 1 1 0 000 2z" fill="#111827" />
                        <path d="M2.5 4.5a5 5 0 017 0" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                        <path d="M0.5 2.5a8 8 0 0111 0" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                      </svg>
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
                          "radial-gradient(ellipse 80% 80% at 85% 0%, rgba(70,72,212,0.35) 0%, transparent 60%), radial-gradient(ellipse 70% 80% at 10% 100%, rgba(107,56,212,0.28) 0%, transparent 60%)",
                      }}
                    />
                    <div className="relative px-4 py-3 flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#4648d4] to-[#6b38d4]" />
                        <div className="absolute inset-0 flex items-center justify-center text-white font-black text-[13px] tracking-tighter">
                          LB
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-white leading-tight">
                          La Barra
                        </p>
                        <p className="text-[10.5px] text-white/60 flex items-center gap-1 mt-0.5">
                          <span className="inline-block w-1 h-1 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
                          Mesa 05 · 3 personas
                        </p>
                      </div>
                      <span className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">
                        #2847
                      </span>
                    </div>
                  </div>

                  {/* Bill items */}
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
                              ? "border-[#4648d4] bg-[#e1e0ff] text-[#4648d4]"
                              : "border-gray-200 text-gray-500"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${m.color}`} />
                          {m.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="px-4 pb-3 flex items-baseline justify-between pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                      Total
                    </span>
                    <span className="text-[26px] font-[900] tabular-nums tracking-tight bg-gradient-to-r from-[#4648d4] to-[#6b38d4] bg-clip-text text-transparent">
                      $107.800
                    </span>
                  </div>

                  {/* Pay CTA */}
                  <div className="px-4 pb-3">
                    <div
                      className="relative w-full py-3 rounded-2xl overflow-hidden"
                      style={{
                        boxShadow: "0 10px 30px -8px rgba(70,72,212,0.4)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#4648d4] to-[#6063ee]" />
                      <span className="relative flex items-center justify-center gap-1.5 text-white text-[13px] font-bold">
                        Pagar $107.800
                        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                      </span>
                    </div>
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

              {/* Soft glow behind phone */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 flex items-center justify-center"
              >
                <div className="w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#4648d4]/15 via-[#6b38d4]/10 to-[#9e00b5]/15 blur-3xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
