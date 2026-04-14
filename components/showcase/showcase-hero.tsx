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
    <section className="relative pt-6 pb-4 px-5">
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col gap-1"
          >
            <div
              className="text-[44px] leading-none"
              style={{
                fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
                color: "#c8102e",
              }}
            >
              crepes<span className="mx-1">&</span>waffles
            </div>
            <span
              className="text-[10px] tracking-[0.28em] uppercase font-semibold"
              style={{ color: "#2d1810", opacity: 0.55 }}
            >
              · experiencia showcase ·
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-white border border-[#f4e4c8] shadow-[0_2px_8px_rgba(45,24,16,0.04)]"
          >
            <span className="w-7 h-7 rounded-full bg-[#c8102e] text-white text-[11px] font-bold flex items-center justify-center">
              12
            </span>
            <span className="text-xs font-semibold text-[#2d1810]">
              {tableLabel}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#d4a574]" />
            <span className="text-[11px] text-[#8a7866]">cuenta abierta</span>
          </motion.div>
        </div>

        <Link
          href="/showcase/qr"
          className="ml-3 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-[#f4e4c8] flex items-center justify-center shadow-[0_2px_8px_rgba(45,24,16,0.04)] hover:bg-white transition-all active:scale-95"
          aria-label="Ver código QR"
          style={{ WebkitBackdropFilter: "blur(8px)" }}
        >
          <QrCode className="w-4 h-4 text-[#2d1810]" strokeWidth={2.2} />
        </Link>
      </div>
    </section>
  );
}
