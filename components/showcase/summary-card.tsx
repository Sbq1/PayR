"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Receipt } from "lucide-react";
import { formatCOP } from "@/lib/utils/currency";

interface SummaryCardProps {
  subtotal: number;
  upsellTotal: number;
  tipAmount: number;
  total: number;
}

export function SummaryCard({
  subtotal,
  upsellTotal,
  tipAmount,
  total,
}: SummaryCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="mx-5 mt-3 mb-5 p-5 rounded-[24px] overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(244,228,200,0.65)",
        boxShadow: "0 8px 32px rgba(45,24,16,0.07), 0 1px 3px rgba(45,24,16,0.04)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-[#fef3e2] flex items-center justify-center">
          <Receipt className="w-3.5 h-3.5 text-[#d4a574]" strokeWidth={2.2} />
        </div>
        <h2
          className="text-[13px] font-semibold text-[#2d1810]"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Resumen de la cuenta
        </h2>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        <Row label="Subtotal" value={subtotal} />
        <AnimatePresence>
          {upsellTotal > 0 && (
            <motion.div
              key="upsell"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
            >
              <Row label="Agregados" value={upsellTotal} accent />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {tipAmount > 0 && (
            <motion.div
              key="tip"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
            >
              <Row label="Propina" value={tipAmount} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Editorial golden separator with diamond ornament */}
      <div className="relative my-5">
        <div
          className="h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(212,165,116,0.55), transparent)",
          }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-[#fef3e2] border border-[#d4a574]/40" />
      </div>

      {/* Total — dramatic */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-[0.28em] text-[#8a7866] font-medium">
            Total a pagar
          </span>
          <span className="text-[10px] text-[#d4a574]">IVA incluido</span>
        </div>
        <motion.span
          key={total}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 340, damping: 20 }}
          className="text-[36px] font-bold text-[#c8102e] tabular-nums leading-none"
          style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 900 }}
        >
          {formatCOP(total)}
        </motion.span>
      </div>
    </motion.section>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="text-[13px]"
        style={{ color: accent ? "#c8102e" : "#8a7866", fontWeight: accent ? 600 : 400 }}
      >
        {label}
      </span>
      <span
        className="text-[14px] font-semibold text-[#2d1810] tabular-nums"
        style={{ fontFamily: "var(--font-fraunces), serif" }}
      >
        {formatCOP(value)}
      </span>
    </div>
  );
}
