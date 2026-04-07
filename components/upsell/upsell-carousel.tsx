"use client";

import { UpsellCard } from "./upsell-card";

interface UpsellProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
}

interface UpsellCarouselProps {
  products: UpsellProduct[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

export function UpsellCarousel({
  products,
  selectedIds,
  onToggle,
}: UpsellCarouselProps) {
  if (products.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 px-4">
        Agrega algo más
      </h3>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
        {products.map((product) => (
          <UpsellCard
            key={product.id}
            {...product}
            isSelected={selectedIds.has(product.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
