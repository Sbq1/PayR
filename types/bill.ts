export interface StandardBillItem {
  productId: string | null;
  name: string;
  quantity: number;
  unitPrice: number; // COP cents
  totalPrice: number; // COP cents
}

export interface StandardBill {
  invoiceId: string;
  tableIdentifier: string;
  items: StandardBillItem[];
  subtotal: number; // COP cents
  tax: number; // COP cents
  total: number; // COP cents
  createdAt: string;
  rawResponse?: unknown;
}

export interface BillResponse {
  orderId: string;
  restaurantName: string;
  restaurantLogo: string | null;
  tableLabel: string;
  items: StandardBillItem[];
  subtotal: number;
  tax: number;
  total: number;
  upsellProducts: UpsellProductDTO[];
}

export interface UpsellProductDTO {
  id: string;
  name: string;
  description: string | null;
  price: number; // COP cents
  imageUrl: string | null;
}
