"use client";

import { useState } from "react";
import { formatCOP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface TipSelectorProps {
  subtotal: number;
  onTipChange: (percentage: number, amount: number) => void;
}

const TIP_OPTIONS = [
  { label: "10%", value: 10 },
  { label: "15%", value: 15 },
  { label: "20%", value: 20 },
  { label: "Otro", value: -1 },
];

export function TipSelector({ subtotal, onTipChange }: TipSelectorProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState("");

  function handleSelect(percentage: number) {
    if (percentage === -1) { setSelected(-1); return; }
    setSelected(percentage);
    setCustomValue("");
    onTipChange(percentage, Math.round((subtotal * percentage) / 100));
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "");
    setCustomValue(val);
    const amount = Number(val) * 100;
    onTipChange(subtotal > 0 ? Math.round((amount / subtotal) * 100) : 0, amount);
  }

  function handleNoTip() {
    setSelected(0);
    setCustomValue("");
    onTipChange(0, 0);
  }

  const tipAmount = selected && selected > 0
    ? Math.round((subtotal * selected) / 100)
    : selected === -1 ? Number(customValue) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Propina</h3>
        {selected !== 0 && (
          <button onClick={handleNoTip} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Sin propina
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {TIP_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={cn(
              "py-3 rounded-xl text-sm font-semibold border",
              "transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
              selected === opt.value
                ? "text-white border-transparent shadow-md scale-[1.03]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800 hover:scale-[1.02] active:scale-95"
            )}
            style={selected === opt.value ? { backgroundColor: "var(--r-primary)", boxShadow: "0 4px 12px var(--r-primary)33" } : undefined}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {selected === -1 && (
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={customValue}
            onChange={handleCustomChange}
            autoFocus
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-8 pr-4 text-gray-900 text-sm placeholder:text-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
        </div>
      )}
      {tipAmount > 0 && (
        <p className="text-xs text-gray-400 text-center">Propina: {formatCOP(tipAmount)}</p>
      )}
    </div>
  );
}
