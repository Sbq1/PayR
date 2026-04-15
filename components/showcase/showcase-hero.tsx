"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { QrCode } from "lucide-react";
import Link from "next/link";

interface ShowcaseHeroProps {
  restaurantName: string;
  tableLabel: string;
}

export function ShowcaseHero({ tableLabel }: ShowcaseHeroProps) {
  return (
    <section className="relative pt-5 pb-0 px-5">
      {/* Top bar: logo + QR button */}
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-2"
          >
            {/* Real logo image */}
            <img
              src="/showcase/cw-logo.svg"
              alt="Crepes & Waffles"
              className="h-[52px] w-auto object-contain object-left"
              style={{ filter: "drop-shadow(0 1px 2px rgba(200,16,46,0.12))" }}
            />
            <span
              className="text-[9px] tracking-[0.35em] uppercase font-medium pl-0.5"
              style={{ color: "#2d1810", opacity: 0.42 }}
            >
              experiencia de pago
            </span>
          </motion.div>

          {/* Table badge — glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 inline-flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-full shadow-[0_2px_16px_rgba(45,24,16,0.06)]"
            style={{
              background: "rgba(255,255,255,0.82)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(244,228,200,0.7)",
            }}
          >
            <span className="w-7 h-7 rounded-full bg-[#c8102e] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
              12
            </span>
            <span
              className="text-[13px] font-semibold text-[#2d1810]"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              {tableLabel}
            </span>
            <span className="flex items-center gap-1">
              <motion.span
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"
              />
              <span className="text-[11px] text-[#8a7866]">cuenta abierta</span>
            </span>
          </motion.div>
        </div>

        <Link
          href="/showcase/qr"
          className="ml-3 mt-1 w-11 h-11 rounded-full flex items-center justify-center shadow-[0_2px_12px_rgba(45,24,16,0.06)] hover:bg-white/90 transition-all active:scale-95"
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(244,228,200,0.7)",
          }}
          aria-label="Ver código QR"
        >
          <QrCode className="text-[#2d1810]" strokeWidth={2.2} style={{ width: 18, height: 18 }} />
        </Link>
      </div>

      {/* Hero food image — editorial wide banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 relative rounded-[24px] overflow-hidden aspect-[16/9] shadow-[0_12px_40px_rgba(45,24,16,0.12)]"
      >
        <img
          src="https://images.unsplash.com/photo-1631206753348-db44968fd440?auto=format&fit=crop&crop=center&w=1200&q=85"
          alt="Crepe de Nutella con Fresas — especialidad de la casa"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(30,12,6,0.82) 0%, rgba(30,12,6,0.20) 60%, transparent 100%)",
          }}
        />
        {/* Editorial label */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p
            className="text-white/70 text-[11px] tracking-[0.28em] uppercase font-medium mb-1"
          >
            Especialidad de la casa
          </p>
          <h2
            className="text-white font-bold text-[22px] leading-tight"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Crepe de Nutella con Fresas
          </h2>
        </div>
        {/* Top-right shine badge */}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <span className="text-[10px] font-semibold text-white/90 tracking-wide uppercase">⭐ Popular</span>
        </div>
      </motion.div>

      {/* Separador editorial dorado */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.4 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(212,165,116,0.45), transparent)",
        }}
      />
    </section>
  );
}
