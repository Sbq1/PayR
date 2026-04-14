"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { formatCOP } from "@/lib/utils/currency";
import { findProductById } from "@/lib/data/showcase-products";
import type { ShowcaseSession } from "@/lib/services/showcase.service";

interface BillFeedProps {
  items: ShowcaseSession["items"];
}

export function BillFeed({ items }: BillFeedProps) {
  return (
    <section className="px-5 pb-3">
      <div className="flex items-baseline justify-between mb-3">
        <h2
          className="text-2xl leading-none"
          style={{
            fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
            color: "#c8102e",
          }}
        >
          tu cuenta
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-[#8a7866]">
          {items.length} {items.length === 1 ? "ítem" : "ítems"}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item, idx) => {
          const product = findProductById(item.productId);
          return (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(45,24,16,0.06)]"
            >
              <div className="relative aspect-[16/11] bg-[#fef3e2]">
                {product?.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 480px"
                    className="object-cover"
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
                <div className="absolute top-3 right-3 min-w-[32px] h-8 px-2 rounded-full bg-[#2d1810] text-white text-xs font-bold flex items-center justify-center tabular-nums shadow-[0_4px_12px_rgba(45,24,16,0.4)]">
                  ×{item.quantity}
                </div>
              </div>

              <div className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {product?.tagline && (
                    <p
                      className="text-xs mb-0.5"
                      style={{
                        fontFamily: "var(--font-showcase, 'Parisienne', cursive)",
                        color: "#c8102e",
                        fontSize: "15px",
                      }}
                    >
                      {product.tagline}
                    </p>
                  )}
                  <h3
                    className="font-bold text-[#2d1810] text-base leading-tight"
                    style={{ fontFamily: "var(--font-fraunces), serif" }}
                  >
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-[#8a7866] mt-1 tabular-nums">
                    {formatCOP(item.unitPrice)} c/u
                  </p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span
                    className="text-lg font-bold text-[#2d1810] tabular-nums"
                    style={{ fontFamily: "var(--font-fraunces), serif" }}
                  >
                    {formatCOP(item.totalPrice)}
                  </span>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
