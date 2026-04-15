"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { motion } from "framer-motion";
import { formatCOP } from "@/lib/utils/currency";
import { findProductById } from "@/lib/data/showcase-products";
import type { ShowcaseSession } from "@/lib/services/showcase.service";

interface BillFeedProps {
  items: ShowcaseSession["items"];
}

export function BillFeed({ items }: BillFeedProps) {
  return (
    <section className="px-5 pb-3 pt-4">
      <div className="flex items-baseline justify-between mb-4">
        <h2
          style={{
            fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
            color: "#c8102e",
            fontSize: "28px",
            lineHeight: 1,
          }}
        >
          tu cuenta
        </h2>
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#8a7866] font-medium">
          {items.length} {items.length === 1 ? "ítem" : "ítems"}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item, idx) => {
          const product = findProductById(item.productId);
          return (
            <BillItemCard key={item.id} item={item} product={product} idx={idx} />
          );
        })}
      </div>
    </section>
  );
}

function BillItemCard({
  item,
  product,
  idx,
}: {
  item: ShowcaseSession["items"][number];
  product: ReturnType<typeof findProductById>;
  idx: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!product?.imageUrl && !imgFailed;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-white rounded-[28px] overflow-hidden shadow-[0_6px_28px_rgba(45,24,16,0.08)]"
    >
      {/* Imagen con overlay editorial */}
      <div className="relative aspect-[16/11] bg-[#fef3e2] overflow-hidden">
        {showImage ? (
          <img
            src={product!.imageUrl}
            alt={item.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${product?.accentFrom ?? "#fef3e2"}, ${product?.accentTo ?? "#d4a574"})`,
            }}
          >
            <span className="text-[80px]">{product?.emoji ?? "🍽️"}</span>
          </div>
        )}

        {/* Gradiente inferior editorial */}
        <div
          className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(45,24,16,0.72) 0%, rgba(45,24,16,0.18) 60%, transparent 100%)",
          }}
        />

        {/* Nombre y precio en el overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3
            className="font-bold leading-tight text-[19px] mb-0.5"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            {item.name}
          </h3>
          <span
            className="text-[22px] font-bold tabular-nums"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            {formatCOP(item.totalPrice)}
          </span>
        </div>

        {/* Quantity badge — editorial light */}
        <div className="absolute top-3 right-3 min-w-[34px] h-8 px-2.5 rounded-full bg-white/90 border border-[#f4e4c8] text-[#2d1810] text-xs font-bold flex items-center justify-center tabular-nums shadow-sm">
          ×{item.quantity}
        </div>
      </div>

      {/* Bloque inferior: tagline + precio unitario */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {product?.tagline ? (
            <p
              style={{
                fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
                color: "#c8102e",
                fontSize: "16px",
                lineHeight: 1.2,
              }}
            >
              {product.tagline}
            </p>
          ) : (
            <p className="text-[11px] text-[#8a7866]">{item.name}</p>
          )}
        </div>
        <p className="text-[11px] text-[#8a7866] tabular-nums flex-shrink-0">
          {formatCOP(item.unitPrice)} c/u
        </p>
      </div>
    </motion.article>
  );
}
