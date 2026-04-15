"use client";

import { motion } from "framer-motion";
import { QrCode } from "lucide-react";
import Link from "next/link";

interface ShowcaseHeroProps {
  restaurantName: string;
  tableLabel: string;
}

export function ShowcaseHero({ tableLabel }: ShowcaseHeroProps) {
  return (
    <section className="relative pt-7 pb-5 px-5">
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-1.5"
          >
            <div
              style={{
                fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
                color: "#c8102e",
                fontSize: "60px",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              crepes<span className="mx-1">&</span>waffles
            </div>
            <span
              className="text-[10px] tracking-[0.3em] uppercase font-medium"
              style={{ color: "#2d1810", opacity: 0.48 }}
            >
              · experiencia showcase ·
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 inline-flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-full bg-white border border-[#f4e4c8] shadow-[0_2px_12px_rgba(45,24,16,0.06)]"
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
                className="inline-block w-1.5 h-1.5 rounded-full bg-[#d4a574]"
              />
              <span className="text-[11px] text-[#8a7866]">cuenta abierta</span>
            </span>
          </motion.div>
        </div>

        <Link
          href="/showcase/qr"
          className="ml-3 mt-1 w-11 h-11 rounded-full bg-white border border-[#f4e4c8] ring-1 ring-[#f4e4c8] flex items-center justify-center shadow-[0_2px_10px_rgba(45,24,16,0.06)] hover:bg-[#fef3e2] transition-all active:scale-95"
          aria-label="Ver código QR"
        >
          <QrCode className="w-4.5 h-4.5 text-[#2d1810]" strokeWidth={2.2} style={{ width: 18, height: 18 }} />
        </Link>
      </div>

      {/* Separador editorial dorado */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.4 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(212,165,116,0.45), transparent)",
        }}
      />
    </section>
  );
}
