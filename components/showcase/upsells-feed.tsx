"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { formatCOP } from "@/lib/utils/currency";
import { findProductByName } from "@/lib/data/showcase-products";
import type { ShowcaseSession } from "@/lib/services/showcase.service";

interface UpsellsFeedProps {
  upsells: ShowcaseSession["upsells"];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  crepes: "Crepe",
  waffles: "Waffle",
  helados: "Helado",
  postres: "Postre",
  bebidas: "Bebida",
  arepas: "Arepa",
};

export function UpsellsFeed({ upsells, selectedIds, onToggle }: UpsellsFeedProps) {
  if (upsells.length === 0) return null;

  return (
    <section className="pt-5 pb-3">
      <div className="px-5 mb-4">
        <h2
          style={{
            fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
            color: "#c8102e",
            fontSize: "28px",
            lineHeight: 1,
          }}
        >
          quizás te provoca
        </h2>
        <p className="text-[12px] text-[#8a7866] mt-1">
          Agregá postres o bebidas al pago de la cuenta
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-0 px-5 pb-3">
        {upsells.map((upsell, idx) => (
          <UpsellCard
            key={upsell.id}
            upsell={upsell}
            idx={idx}
            selected={selectedIds.has(upsell.id)}
            onToggle={() => onToggle(upsell.id)}
          />
        ))}
      </div>
    </section>
  );
}

function UpsellCard({
  upsell,
  idx,
  selected,
  onToggle,
}: {
  upsell: ShowcaseSession["upsells"][number];
  idx: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!upsell.imageUrl && !imgFailed;

  const category = findProductByName(upsell.name)?.category;
  const categoryLabel = category ? CATEGORY_LABELS[category] ?? "Sugerido" : "Sugerido";

  return (
    <motion.button
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.965 }}
      onClick={onToggle}
      className="relative flex-shrink-0 w-[60vw] max-w-[240px] rounded-3xl overflow-hidden bg-white text-left focus:outline-none"
      style={{
        boxShadow: selected
          ? "0 8px 32px rgba(200,16,46,0.22)"
          : "0 6px 24px rgba(45,24,16,0.08)",
        border: selected ? "3px solid #c8102e" : "3px solid transparent",
        outline: selected ? "4px solid rgba(200,16,46,0.12)" : "4px solid transparent",
        transition: "border-color 0.18s, box-shadow 0.18s, outline-color 0.18s",
      }}
    >
      <div className="relative aspect-[4/5]">
        {showImage ? (
          <img
            src={upsell.imageUrl!}
            alt={upsell.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #fef3e2 0%, #d4a574 100%)",
            }}
          />
        )}

        {/* Gradiente inferior más dramático */}
        <div
          className="absolute inset-x-0 bottom-0 h-[62%] pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(30,12,6,0.94) 0%, rgba(30,12,6,0.35) 55%, transparent 100%)",
          }}
        />

        {/* Check animado (seleccionado) */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#c8102e] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(200,16,46,0.55)]"
            >
              <Check className="w-4 h-4" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge de categoría — reemplaza "sugerido" */}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d4a574]/25 backdrop-blur-[4px]">
          <span className="text-[9px] uppercase tracking-[0.22em] font-semibold text-white/90">
            {categoryLabel}
          </span>
        </div>

        {/* Info sobre la foto */}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          {upsell.description && (
            <p
              className="mb-1 opacity-85"
              style={{
                fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
                fontSize: "15px",
                lineHeight: 1.2,
              }}
            >
              {upsell.description}
            </p>
          )}
          <h3
            className="font-bold leading-tight mb-2.5 text-[18px]"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            {upsell.name}
          </h3>
          <div className="flex items-center justify-between">
            <span
              className="text-[20px] font-bold tabular-nums"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              {formatCOP(upsell.price)}
            </span>
            <motion.div
              animate={{
                backgroundColor: selected ? "#ffffff" : "rgba(255,255,255,0.18)",
                color: selected ? "#c8102e" : "#ffffff",
              }}
              transition={{ duration: 0.15 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.93 }}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            >
              {selected ? (
                <Check className="w-4 h-4" strokeWidth={3} />
              ) : (
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
