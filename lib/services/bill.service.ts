import { db } from "@/lib/db";
import { getPosAdapter } from "@/lib/adapters/pos";
import { getFiveUvtInCents } from "@/lib/services/tax.service";
import { NotFoundError } from "@/lib/utils/errors";
import type { StandardBill } from "@/lib/adapters/pos/types";

export interface BillResponse {
  orderId: string;
  /**
   * Version del lock optimista. El cliente debe enviarlo de vuelta en
   * POST /api/payment/create como `expectedVersion` para que el server
   * detecte si otra sesión modificó la orden entre el bill y el pago.
   */
  orderVersion: number;
  restaurant: {
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    /**
     * Régimen DIAN del restaurante. El cliente decide si mostrar el form
     * de customer_document basado en este valor (MANDATORY + total >=
     * fiveUvtCents).
     */
    feRegime: "MANDATORY" | "OPTIONAL" | "EXEMPT";
    /**
     * 5 UVT en centavos COP. Pre-calculado server-side para evitar un
     * endpoint extra. Vale 0 si feRegime !== 'MANDATORY' (el cliente
     * no usa el valor en ese caso — evita forzar lookup del UVT cuando
     * la lógica del umbral no aplica).
     */
    fiveUvtCents: number;
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

  // Lazy UVT lookup: solo si MANDATORY, para no forzar que tax_parameters
  // esté cargado en restaurantes OPTIONAL/EXEMPT.
  const fiveUvtCents =
    restaurant.fe_regime === "MANDATORY" ? await getFiveUvtInCents() : 0;

  return {
    orderId: order.id,
    orderVersion: order.version,
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      logoUrl: restaurant.logo_url,
      primaryColor: restaurant.primary_color,
      secondaryColor: restaurant.secondary_color,
      backgroundColor: restaurant.background_color,
      feRegime: restaurant.fe_regime,
      fiveUvtCents,
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
