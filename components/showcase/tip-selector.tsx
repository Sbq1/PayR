"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Pencil } from "lucide-react";
import { formatCOP } from "@/lib/utils/currency";

interface TipSelectorProps {
  subtotal: number;
  selectedPercentage: number;
  customAmount: number | null;
  onSelect: (percentage: number) => void;
  onCustom: (amountInCents: number) => void;
}

const TIP_OPTIONS = [
  { percentage: 0, label: "Sin" },
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
      <div className="flex items-baseline justify-between mb-4">
        <h2
          style={{
            fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
            color: "#c8102e",
            fontSize: "28px",
            lineHeight: 1,
          }}
        >
          propina
        </h2>
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#8a7866] font-medium">
          100% para el equipo
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {TIP_OPTIONS.map((option) => {
          const active = !isCustom && selectedPercentage === option.percentage;
          const optionAmount = Math.round((subtotal * option.percentage) / 100);
          return (
            <motion.button
              key={option.percentage}
              layout
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelect(option.percentage)}
              className="relative flex flex-col items-center justify-center py-3.5 rounded-2xl font-bold text-[13px] transition-colors"
              style={{
                background: active ? "#c8102e" : "#ffffff",
                color: active ? "#ffffff" : "#2d1810",
                border: active ? "2px solid #c8102e" : "2px solid #f4e4c8",
                boxShadow: active ? "0 6px 22px rgba(200,16,46,0.30)" : "none",
              }}
            >
              <span>{option.label}</span>
              {option.percentage > 0 && (
                <span
                  className="text-[10px] font-normal mt-0.5 tabular-nums leading-none"
                  style={{ color: active ? "rgba(255,255,255,0.72)" : "#8a7866" }}
                >
                  {optionAmount > 0 ? formatCOP(optionAmount) : ""}
                </span>
              )}
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
        className="mt-2.5 w-full py-3.5 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all"
        style={{
          background: isCustom ? "#c8102e" : "transparent",
          color: isCustom ? "#ffffff" : "#2d1810",
          border: isCustom ? "2px solid #c8102e" : "2px dotted #d4a574",
        }}
      >
        <Pencil
          className="flex-shrink-0"
          style={{
            width: 12,
            height: 12,
            color: isCustom ? "rgba(255,255,255,0.8)" : "#d4a574",
          }}
          strokeWidth={2.2}
        />
        {isCustom
          ? `Personalizada · ${formatCOP(customAmount)}`
          : "Personalizar monto"}
      </motion.button>

      <AnimatePresence>
        {tipAmount > 0 && (
          <motion.p
            key={tipAmount}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            className="text-center text-xs text-[#8a7866] mt-3 tabular-nums"
          >
            + {formatCOP(tipAmount)} de propina al equipo
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
