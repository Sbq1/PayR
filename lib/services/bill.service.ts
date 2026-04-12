import { db } from "@/lib/db";
import { getPosAdapter } from "@/lib/adapters/pos";
import { NotFoundError } from "@/lib/utils/errors";
import type { StandardBill } from "@/lib/adapters/pos/types";

export interface BillResponse {
  orderId: string;
  restaurant: {
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
  };
  table: {
    id: string;
    label: string | null;
    tableNumber: number;
  };
  bill: StandardBill;
  upsellProducts: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
  }>;
}

/**
 * Obtiene la cuenta de una mesa:
 * 1. Busca restaurante por slug
 * 2. Busca mesa por tableId
 * 3. Consulta el POS via adaptador
 * 4. Persiste/actualiza la orden en BD
 * 5. Retorna la cuenta formateada con upsells
 */
export async function getBillForTable(
  slug: string,
  tableId: string
): Promise<BillResponse> {
  // 1. Buscar restaurante
  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    include: { subscription_plans: true },
  });

  if (!restaurant || !restaurant.is_active) {
    throw new NotFoundError("Restaurante");
  }

  // 2. Buscar mesa
  const table = await db.table.findFirst({
    where: {
      id: tableId,
      restaurant_id: restaurant.id,
      is_active: true,
    },
  });

  if (!table) {
    throw new NotFoundError("Mesa");
  }

  if (!table.siigo_cost_center_id) {
    throw new NotFoundError("Configuracion de mesa en POS");
  }

  // 3. Consultar POS
  const adapter = getPosAdapter({
    posProvider: restaurant.pos_provider,
    siigoUsername: restaurant.siigo_username,
    siigoAccessKey: restaurant.siigo_access_key,
  });

  const bill = await adapter.getBill(table.siigo_cost_center_id);

  if (!bill) {
    throw new NotFoundError("Cuenta abierta para esta mesa");
  }

  // 4. Persistir orden — transacción para evitar duplicados en scans concurrentes
  const order = await db.$transaction(async (tx) => {
    const existing = await tx.order.findFirst({
      where: {
        restaurant_id: restaurant.id,
        table_id: table.id,
        siigo_invoice_id: bill.invoiceId,
        status: { in: ["PENDING", "PAYING"] },
      },
    });

    if (existing) {
      return tx.order.update({
        where: { id: existing.id },
        data: {
          subtotal: bill.subtotal,
          tax: bill.totalTax,
          total: bill.total,
        },
      });
    }

    const newOrder = await tx.order.create({
      data: {
        restaurant_id: restaurant.id,
        table_id: table.id,
        siigo_invoice_id: bill.invoiceId,
        subtotal: bill.subtotal,
        tax: bill.totalTax,
        total: bill.total,
        status: "PENDING",
      },
    });

    // Mark table as occupied
    await tx.table.update({
      where: { id: table.id },
      data: { status: "OCCUPIED" },
    });

    if (bill.items.length > 0) {
      await tx.orderItem.createMany({
        data: bill.items.map((item) => ({
          order_id: newOrder.id,
          siigo_product_id: item.productId,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          is_upsell: false,
        })),
      });
    }

    return newOrder;
  });

  // 5. Obtener upsell products si el plan lo permite
  let upsellProducts: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
  }> = [];

  if (restaurant.subscription_plans.allow_upsell) {
    upsellProducts = await db.upsellProduct.findMany({
      where: { restaurant_id: restaurant.id, is_active: true },
      orderBy: { sort_order: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image_url: true,
      },
    });
  }

  return {
    orderId: order.id,
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      logoUrl: restaurant.logo_url,
      primaryColor: restaurant.primary_color,
      secondaryColor: restaurant.secondary_color,
      backgroundColor: restaurant.background_color,
    },
    table: {
      id: table.id,
      label: table.label,
      tableNumber: table.table_number,
    },
    bill,
    upsellProducts: upsellProducts.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      imageUrl: p.image_url,
    })),
  };
}
