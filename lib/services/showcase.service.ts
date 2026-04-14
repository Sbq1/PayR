import { db } from "@/lib/db";
import {
  SHOWCASE_CART_ITEMS,
  findProductById,
} from "@/lib/data/showcase-products";

const SHOWCASE_SLUG = "showcase";
const SHOWCASE_TABLE_ID = "tbl_showcase_demo";

export interface ShowcaseSession {
  orderId: string;
  slug: string;
  tableId: string;
  restaurant: {
    name: string;
    tableLabel: string;
  };
  items: Array<{
    id: string;
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  upsells: Array<{
    id: string;
    productId: string | null;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
  }>;
  subtotal: number;
}

/**
 * Retorna la sesión activa del /showcase. Si no hay una Order PENDING,
 * crea una nueva con los items demo pre-cargados.
 */
export async function getOrCreateShowcaseSession(): Promise<ShowcaseSession> {
  const restaurant = await db.restaurant.findUnique({
    where: { slug: SHOWCASE_SLUG },
    select: { id: true, name: true },
  });

  if (!restaurant) {
    throw new Error(
      "Showcase no inicializado: corré `npx tsx scripts/seed-showcase.ts`"
    );
  }

  const table = await db.table.findUnique({
    where: { id: SHOWCASE_TABLE_ID },
    select: { id: true, label: true },
  });

  if (!table) throw new Error("Mesa demo no encontrada");

  // Busca Order PENDING (no PAID ni CANCELLED ni PAYING)
  let order = await db.order.findFirst({
    where: {
      restaurant_id: restaurant.id,
      table_id: table.id,
      status: "PENDING",
    },
    orderBy: { created_at: "desc" },
    include: { order_items: true },
  });

  // Si no hay, crea una nueva con los items demo
  if (!order) {
    const orderItems = SHOWCASE_CART_ITEMS.map((cartItem) => {
      const product = findProductById(cartItem.productId);
      if (!product) throw new Error(`Producto demo inválido: ${cartItem.productId}`);
      return {
        siigo_product_id: product.id,
        name: product.name,
        quantity: cartItem.quantity,
        unit_price: product.priceInCents,
        total_price: product.priceInCents * cartItem.quantity,
        is_upsell: false,
      };
    });

    const subtotal = orderItems.reduce((s, i) => s + i.total_price, 0);

    order = await db.order.create({
      data: {
        restaurant_id: restaurant.id,
        table_id: table.id,
        subtotal,
        tax: 0,
        total: subtotal,
        customer_count: 1,
        status: "PENDING",
        order_items: { create: orderItems },
      },
      include: { order_items: true },
    });
  }

  // Upsells activos del restaurant showcase
  const upsells = await db.upsellProduct.findMany({
    where: { restaurant_id: restaurant.id, is_active: true },
    orderBy: { sort_order: "asc" },
  });

  return {
    orderId: order.id,
    slug: SHOWCASE_SLUG,
    tableId: table.id,
    restaurant: {
      name: restaurant.name,
      tableLabel: table.label || "Showcase",
    },
    items: order.order_items.map((i) => ({
      id: i.id,
      productId: i.siigo_product_id || "",
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      totalPrice: i.total_price,
    })),
    upsells: upsells.map((u) => ({
      id: u.id,
      productId: null,
      name: u.name,
      description: u.description,
      price: u.price,
      imageUrl: u.image_url,
    })),
    subtotal: order.subtotal,
  };
}
