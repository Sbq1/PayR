"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { formatCOP } from "@/lib/utils/currency";
import type { ShowcaseSession } from "@/lib/services/showcase.service";

interface UpsellsFeedProps {
  upsells: ShowcaseSession["upsells"];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

export function UpsellsFeed({ upsells, selectedIds, onToggle }: UpsellsFeedProps) {
  if (upsells.length === 0) return null;

  return (
    <section className="px-5 pt-5 pb-3">
      <div className="mb-3">
        <h2
          className="text-2xl leading-none mb-1"
          style={{
            fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
            color: "#c8102e",
          }}
        >
          quizás te provoca
        </h2>
        <p className="text-[11px] text-[#8a7866]">
          Agregá postres o bebidas al pago de la cuenta
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
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

  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.06 }}
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      className="relative flex-shrink-0 w-[68vw] max-w-[280px] rounded-3xl overflow-hidden bg-white shadow-[0_6px_24px_rgba(45,24,16,0.08)] text-left focus:outline-none"
      style={{
        border: selected ? "2px solid #c8102e" : "2px solid transparent",
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

        <div
          className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(45,24,16,0.95) 0%, rgba(45,24,16,0.3) 60%, transparent 100%)",
          }}
        />

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#c8102e] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(200,16,46,0.5)]"
            >
              <Check className="w-4 h-4" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#2d1810]">
            sugerido
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          {upsell.description && (
            <p
              className="text-xs mb-1 opacity-90"
              style={{
                fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
                fontSize: "15px",
              }}
            >
              {upsell.description}
            </p>
          )}
          <h3
            className="font-bold text-base leading-tight mb-2"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            {upsell.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold tabular-nums">
              {formatCOP(upsell.price)}
            </span>
            <motion.div
              animate={{
                backgroundColor: selected ? "#ffffff" : "rgba(255,255,255,0.2)",
                color: selected ? "#c8102e" : "#ffffff",
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md"
              style={{ WebkitBackdropFilter: "blur(8px)" }}
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
