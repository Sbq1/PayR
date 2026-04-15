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
    <section className="px-5 pb-2 pt-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2
          style={{
            fontFamily: "var(--font-fraunces), serif",
            color: "#2d1810",
            fontSize: "20px",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          Tu cuenta
        </h2>
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#8a7866] font-medium">
          {items.length} {items.length === 1 ? "ítem" : "ítems"}
        </span>
      </div>

      <div className="flex flex-col gap-3">
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-center gap-4 p-3 rounded-[20px] overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(244,228,200,0.65)",
        boxShadow: "0 4px 20px rgba(45,24,16,0.06), 0 1px 3px rgba(45,24,16,0.04)",
      }}
    >
      {/* Thumbnail */}
      <div className="relative w-[76px] h-[76px] rounded-[14px] overflow-hidden flex-shrink-0 shadow-[0_2px_8px_rgba(45,24,16,0.08)]">
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
            <span className="text-[36px]">{product?.emoji ?? "🍽️"}</span>
          </div>
        )}

        {/* Quantity badge */}
        {item.quantity > 1 && (
          <div className="absolute -top-0.5 -right-0.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#c8102e] text-white text-[10px] font-bold flex items-center justify-center tabular-nums shadow-[0_2px_6px_rgba(200,16,46,0.4)]">
            ×{item.quantity}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3
          className="font-bold text-[15px] text-[#2d1810] leading-tight truncate"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          {item.name}
        </h3>
        {product?.tagline && (
          <p
            className="text-[12px] text-[#8a7866] mt-0.5 truncate"
            style={{ fontFamily: "var(--font-fraunces), serif", fontStyle: "italic" }}
          >
            {product.tagline}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span
            className="text-[16px] font-bold text-[#c8102e] tabular-nums"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            {formatCOP(item.totalPrice)}
          </span>
          {item.quantity > 1 && (
            <span className="text-[11px] text-[#8a7866] tabular-nums">
              ({formatCOP(item.unitPrice)} c/u)
            </span>
          )}
        </div>
      </div>

      {/* Decorative accent line left */}
      <div
        className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full"
        style={{
          background: `linear-gradient(to bottom, ${product?.accentFrom ?? "#fef3e2"}, ${product?.accentTo ?? "#d4a574"})`,
        }}
      />
    </motion.article>
  );
}
