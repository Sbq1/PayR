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
    <section className="pt-6 pb-3">
      <div className="px-5 mb-4">
        <h2
          style={{
            fontFamily: "var(--font-fraunces), serif",
            color: "#2d1810",
            fontSize: "20px",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          Quizás te provoca
        </h2>
        <p className="text-[12px] text-[#8a7866] mt-1.5"
          style={{ fontFamily: "var(--font-fraunces), serif", fontStyle: "italic" }}
        >
          Agregá algo especial a tu cuenta
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
  const product = findProductByName(upsell.name);
  const showImage = !!(upsell.imageUrl || product?.imageUrl) && !imgFailed;
  const imageUrl = upsell.imageUrl || product?.imageUrl || "";

  const category = product?.category;
  const categoryLabel = category ? CATEGORY_LABELS[category] ?? "Sugerido" : "Sugerido";

  return (
    <motion.button
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.965 }}
      onClick={onToggle}
      className="relative flex-shrink-0 w-[58vw] max-w-[230px] rounded-[22px] overflow-hidden text-left focus:outline-none"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: selected
          ? "0 8px 32px rgba(200,16,46,0.22)"
          : "0 6px 24px rgba(45,24,16,0.08)",
        border: selected ? "2.5px solid #c8102e" : "2.5px solid rgba(244,228,200,0.5)",
        outline: selected ? "3px solid rgba(200,16,46,0.10)" : "3px solid transparent",
        transition: "border-color 0.18s, box-shadow 0.18s, outline-color 0.18s",
      }}
    >
      <div className="relative aspect-[4/5]">
        {showImage ? (
          <img
            src={imageUrl}
            alt={upsell.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${product?.accentFrom ?? "#fef3e2"} 0%, ${product?.accentTo ?? "#d4a574"} 100%)`,
            }}
          >
            <span className="text-[56px]">{product?.emoji ?? "🍽️"}</span>
          </div>
        )}

        {/* Bottom gradient — more dramatic */}
        <div
          className="absolute inset-x-0 bottom-0 h-[65%] pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(20,8,4,0.92) 0%, rgba(20,8,4,0.40) 55%, transparent 100%)",
          }}
        />

        {/* Check badge (selected) */}
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

        {/* Category badge — glassmorphism */}
        <div
          className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <span className="text-[9px] uppercase tracking-[0.22em] font-semibold text-white/90">
            {categoryLabel}
          </span>
        </div>

        {/* Info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          {upsell.description && (
            <p
              className="mb-1 opacity-80 text-[12px] leading-tight"
              style={{
                fontFamily: "var(--font-fraunces), serif",
                fontStyle: "italic",
              }}
            >
              {upsell.description}
            </p>
          )}
          <h3
            className="font-bold leading-tight mb-2.5 text-[17px]"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            {upsell.name}
          </h3>
          <div className="flex items-center justify-between">
            <span
              className="text-[19px] font-bold tabular-nums"
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
              style={{
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
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
