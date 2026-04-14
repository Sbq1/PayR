"use client";

import { motion } from "framer-motion";
import { formatCOP } from "@/lib/utils/currency";

interface TipSelectorProps {
  subtotal: number;
  selectedPercentage: number;
  customAmount: number | null;
  onSelect: (percentage: number) => void;
  onCustom: (amountInCents: number) => void;
}

const TIP_OPTIONS = [
  { percentage: 0, label: "Sin propina" },
  { percentage: 10, label: "10%" },
  { percentage: 15, label: "15%" },
  { percentage: 20, label: "20%" },
];

export function TipSelector({
  subtotal,
  selectedPercentage,
  customAmount,
  onSelect,
  onCustom,
}: TipSelectorProps) {
  const getTipAmount = () => {
    if (customAmount !== null) return customAmount;
    return Math.round((subtotal * selectedPercentage) / 100);
  };

  const tipAmount = getTipAmount();
  const isCustom = customAmount !== null;

  return (
    <section className="px-5 pt-5 pb-3">
      <div className="flex items-baseline justify-between mb-3">
        <h2
          className="text-2xl leading-none"
          style={{
            fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
            color: "#c8102e",
          }}
        >
          propina
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-[#8a7866]">
          100% para el equipo
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {TIP_OPTIONS.map((option) => {
          const active = !isCustom && selectedPercentage === option.percentage;
          return (
            <motion.button
              key={option.percentage}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect(option.percentage)}
              className="relative py-3 rounded-2xl font-bold text-xs transition-all"
              style={{
                background: active ? "#c8102e" : "#ffffff",
                color: active ? "#ffffff" : "#2d1810",
                border: active ? "2px solid #c8102e" : "2px solid #f4e4c8",
                boxShadow: active ? "0 6px 20px rgba(200,16,46,0.28)" : "none",
              }}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          const current = customAmount ?? 0;
          const defaultSugg = Math.round(subtotal * 0.12);
          const input = window.prompt(
            "Propina personalizada en pesos COP (ej: 5000)",
            String(Math.round((current || defaultSugg) / 100))
          );
          if (input === null) return;
          const pesos = parseInt(input, 10);
          if (isNaN(pesos) || pesos < 0) return;
          onCustom(pesos * 100);
        }}
        className="mt-2 w-full py-3 rounded-2xl text-xs font-semibold transition-all"
        style={{
          background: isCustom ? "#c8102e" : "transparent",
          color: isCustom ? "#ffffff" : "#2d1810",
          border: isCustom ? "2px solid #c8102e" : "2px dashed #d4a574",
        }}
      >
        {isCustom
          ? `Personalizada · ${formatCOP(customAmount)}`
          : "Otro monto"}
      </motion.button>

      {tipAmount > 0 && (
        <motion.p
          key={tipAmount}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-xs text-[#8a7866] mt-3 tabular-nums"
        >
          + {formatCOP(tipAmount)} de propina
        </motion.p>
      )}
    </section>
  );
}
