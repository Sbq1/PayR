"use client";

import { motion } from "framer-motion";
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
      layout
      className="mx-5 mt-2 mb-5 p-5 bg-white rounded-3xl shadow-[0_4px_20px_rgba(45,24,16,0.06)]"
    >
      <h2
        className="text-xs uppercase tracking-widest text-[#8a7866] mb-3"
      >
        Resumen
      </h2>
      <div className="space-y-2 text-sm">
        <Row label="Subtotal" value={subtotal} />
        {upsellTotal > 0 && (
          <Row label="Agregados" value={upsellTotal} accent />
        )}
        {tipAmount > 0 && <Row label="Propina" value={tipAmount} />}
      </div>
      <div className="my-4 h-px bg-[#f4e4c8]" />
      <div className="flex items-baseline justify-between">
        <span
          className="text-sm font-medium text-[#2d1810]"
        >
          Total a pagar
        </span>
        <motion.span
          key={total}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-bold text-[#c8102e] tabular-nums"
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
      <span className={accent ? "text-[#c8102e] font-semibold" : "text-[#8a7866]"}>
        {label}
      </span>
      <span className="font-semibold text-[#2d1810] tabular-nums">
        {formatCOP(value)}
      </span>
    </div>
  );
}
