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
      className="mx-5 mt-2 mb-5 p-5 bg-white rounded-[28px] shadow-[0_6px_28px_rgba(45,24,16,0.07)]"
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-4">
        <Receipt className="w-3.5 h-3.5 text-[#d4a574]" strokeWidth={2} />
        <h2 className="text-[10px] uppercase tracking-[0.24em] text-[#8a7866] font-medium">
          Resumen
        </h2>
      </div>

      {/* Filas */}
      <div className="space-y-2.5">
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

      {/* Separador dorado editorial */}
      <div
        className="my-4 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(212,165,116,0.55), transparent)",
        }}
      />

      {/* Total */}
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.24em] text-[#8a7866] font-medium">
          Total a pagar
        </span>
        <motion.span
          key={total}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 340, damping: 20 }}
          className="text-[40px] font-bold text-[#c8102e] tabular-nums leading-none"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
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
