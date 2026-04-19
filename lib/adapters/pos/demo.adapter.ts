import type { IPosAdapter, StandardBill } from "./types";

/**
 * Adaptador demo para pruebas sin POS real.
 * Retorna datos mock de una cuenta tipica de restaurante colombiano.
 */

const DEMO_BILLS: Record<string, StandardBill> = {
  "101": {
    invoiceId: "demo-inv-001",
    invoiceName: "FV-001-101",
    tableIdentifier: "101",
    items: [
      {
        productId: "prod-001",
        code: "HAM-01",
        name: "Hamburguesa Artesanal",
        quantity: 2,
        unitPrice: 2800000,
        discount: 0,
        tax: 532000,
        totalPrice: 6132000,
      },
      {
        productId: "prod-002",
        code: "CER-01",
        name: "Cerveza Club Colombia",
        quantity: 3,
        unitPrice: 900000,
        discount: 0,
        tax: 513000,
        totalPrice: 3213000,
      },
      {
        productId: "prod-003",
        code: "BAN-01",
        name: "Bandeja Paisa",
        quantity: 1,
        unitPrice: 3500000,
        discount: 0,
        tax: 665000,
        totalPrice: 4165000,
      },
      {
        productId: "prod-004",
        code: "LIM-01",
        name: "Limonada de Coco",
        quantity: 2,
        unitPrice: 700000,
        discount: 0,
        tax: 266000,
        totalPrice: 1666000,
      },
    ],
    subtotal: 12700000,
    totalDiscount: 0,
    totalTax: 1976000,
    total: 15176000,
    currency: "COP",
    createdAt: new Date().toISOString(),
  },
  "102": {
    invoiceId: "demo-inv-002",
    invoiceName: "FV-001-102",
    tableIdentifier: "102",
    items: [
      {
        productId: "prod-007",
        code: "ARE-01",
        name: "Arepa con Queso",
        quantity: 3,
        unitPrice: 800000,
        discount: 0,
        tax: 456000,
        totalPrice: 2856000,
      },
      {
        productId: "prod-008",
        code: "JUG-01",
        name: "Jugo Natural de Mango",
        quantity: 3,
        unitPrice: 600000,
        discount: 0,
        tax: 342000,
        totalPrice: 2142000,
      },
    ],
    subtotal: 4200000,
    totalDiscount: 0,
    totalTax: 798000,
    total: 4998000,
    currency: "COP",
    createdAt: new Date().toISOString(),
  },
  "103": {
    invoiceId: "demo-inv-003",
    invoiceName: "FV-001-103",
    tableIdentifier: "103",
    items: [
      {
        productId: "prod-005",
        code: "SAL-01",
        name: "Salmon a la Plancha",
        quantity: 1,
        unitPrice: 4200000,
        discount: 0,
        tax: 798000,
        totalPrice: 4998000,
      },
      {
        productId: "prod-006",
        code: "VIN-01",
        name: "Copa de Vino Tinto",
        quantity: 2,
        unitPrice: 2200000,
        discount: 0,
        tax: 836000,
        totalPrice: 5236000,
      },
    ],
    subtotal: 8600000,
    totalDiscount: 0,
    totalTax: 1634000,
    total: 10234000,
    currency: "COP",
    createdAt: new Date().toISOString(),
  },
};

export class DemoAdapter implements IPosAdapter {
  async authenticate(): Promise<string> {
    return "demo-token";
  }

  async getBill(tableIdentifier: string): Promise<StandardBill | null> {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 300));
    return DEMO_BILLS[tableIdentifier] || null;
  }

  async closeTable(_params: {
    invoiceId: string;
    amount: number;
    dianDocType: "POS_EQUIVALENT" | "E_INVOICE";
    customerDocument?: { type: string; number: string };
  }): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // En demo, no hacemos nada real
  }
}
