"use client";

import { formatCOP } from "@/lib/utils/currency";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpsellCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export function UpsellCard({ id, name, description, price, imageUrl, isSelected, onToggle }: UpsellCardProps) {
  return (
    <button
      onClick={() => onToggle(id)}
      className={cn(
        "flex-shrink-0 w-36 rounded-2xl p-3 text-left border",
        "transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
        isSelected
          ? "border-[var(--r-primary)] bg-indigo-50 shadow-md scale-[1.03]"
          : "border-gray-200 bg-white hover:border-gray-300 shadow-sm hover:shadow-md hover:-translate-y-1"
      )}
    >
      <div className="w-full h-20 rounded-xl bg-gray-100 mb-2 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span className="text-2xl">{name.includes("Postre") ? "🍰" : name.includes("Cafe") ? "☕" : "🍷"}</span>
        )}
      </div>
      <p className="text-xs font-semibold text-gray-900 truncate">{name}</p>
      {description && <p className="text-[10px] text-gray-400 truncate mt-0.5">{description}</p>}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-bold text-gray-900">{formatCOP(price)}</span>
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
            isSelected ? "bg-[var(--r-primary)]" : "bg-gray-100"
          )}
        >
          {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </div>
    </button>
  );
}
