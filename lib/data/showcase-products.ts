export interface ShowcaseProduct {
  id: string;
  name: string;
  tagline: string;
  description: string;
  priceInCents: number;
  category: "crepes" | "waffles" | "helados" | "postres" | "bebidas" | "arepas";
  imageUrl: string;
  emoji: string;
  accentFrom: string;
  accentTo: string;
  accentOverlay: string;
}

const ALL_PRODUCTS: ShowcaseProduct[] = [
  {
    id: "p_crepe_nutella",
    name: "Crepe de Nutella con Fresas",
    tagline: "Masa dorada, corazón de Nutella",
    description:
      "Masa delgada y dorada rellena de Nutella derretida, fresas frescas cortadas y una nube de helado de vainilla artesanal.",
    priceInCents: 2490000,
    category: "crepes",
    imageUrl:
      "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&crop=center&w=800&q=85",
    emoji: "🍓",
    accentFrom: "#fde4e4",
    accentTo: "#f8b4b4",
    accentOverlay: "rgba(200,40,60,0.18)",
  },
  {
    id: "p_waffle_belga",
    name: "Waffle Belga con Helado",
    tagline: "Crocante por fuera, tierno por dentro",
    description:
      "Waffle belga recién horneado, dos bolas de helado artesanal, crema chantilly y salsa de chocolate belga.",
    priceInCents: 2850000,
    category: "waffles",
    imageUrl:
      "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&crop=center&w=800&q=85",
    emoji: "🧇",
    accentFrom: "#fef3c7",
    accentTo: "#fbbf24",
    accentOverlay: "rgba(212,165,116,0.22)",
  },
  {
    id: "p_limonada_cereza",
    name: "Limonada de Cereza",
    tagline: "Refrescante y distinta",
    description:
      "Limonada natural con pulpa de cereza fresca, hierbabuena y un toque de jengibre. Servida en jarra de cristal.",
    priceInCents: 1150000,
    category: "bebidas",
    imageUrl:
      "https://images.unsplash.com/photo-1523371683702-26783cd53fe7?auto=format&fit=crop&crop=center&w=800&q=85",
    emoji: "🍒",
    accentFrom: "#fecdd3",
    accentTo: "#f43f5e",
    accentOverlay: "rgba(244,63,94,0.18)",
  },
  {
    id: "p_helado_stracciatella",
    name: "Helado Artesanal Stracciatella",
    tagline: "Dos bolas de felicidad pura",
    description:
      "Crema italiana con virutas de chocolate amargo. Servido en copa con galleta de almendra.",
    priceInCents: 1550000,
    category: "helados",
    imageUrl:
      "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&crop=center&w=800&q=85",
    emoji: "🍦",
    accentFrom: "#f0f9ff",
    accentTo: "#bae6fd",
    accentOverlay: "rgba(100,180,220,0.15)",
  },
  {
    id: "p_tres_leches",
    name: "Postre Tres Leches",
    tagline: "La casa entera en un plato",
    description:
      "Bizcocho esponjoso bañado en tres leches, crema batida casera y canela tostada.",
    priceInCents: 1990000,
    category: "postres",
    imageUrl:
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&crop=center&w=800&q=85",
    emoji: "🍰",
    accentFrom: "#fef3e2",
    accentTo: "#fcd34d",
    accentOverlay: "rgba(212,165,116,0.20)",
  },
  {
    id: "p_chocolate_queso",
    name: "Chocolate Caliente con Queso",
    tagline: "Tradición colombiana de siempre",
    description:
      "Chocolate amargo colombiano batido a mano, con cubos de queso campesino fresco.",
    priceInCents: 1250000,
    category: "bebidas",
    imageUrl:
      "https://images.unsplash.com/photo-1542990253-0d8ba5d68e52?auto=format&fit=crop&crop=center&w=800&q=85",
    emoji: "☕",
    accentFrom: "#fce7d4",
    accentTo: "#d4a574",
    accentOverlay: "rgba(180,100,40,0.20)",
  },
];

export const SHOWCASE_PRODUCTS: ShowcaseProduct[] = ALL_PRODUCTS;

/**
 * Items que el "mesero ya cargó" en la cuenta al entrar al /showcase.
 * Se usan al crear la Order demo (con siigo_product_id = product.id).
 */
export const SHOWCASE_CART_ITEMS: Array<{ productId: string; quantity: number }> = [
  { productId: "p_crepe_nutella", quantity: 2 },
  { productId: "p_limonada_cereza", quantity: 1 },
];

/**
 * Productos sugeridos como upsell ("también te puede gustar").
 */
export const SHOWCASE_UPSELL_IDS: string[] = [
  "p_tres_leches",
  "p_helado_stracciatella",
  "p_chocolate_queso",
  "p_waffle_belga",
];

export function findProductById(id: string): ShowcaseProduct | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id);
}

export function findProductByName(name: string): ShowcaseProduct | undefined {
  return ALL_PRODUCTS.find((p) => p.name === name);
}
