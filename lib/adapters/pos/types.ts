/**
 * Formato estandar interno de un item de cuenta.
 * Todos los precios en centavos COP.
 */
export interface StandardBillItem {
  productId: string | null;
  code: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  totalPrice: number;
}

/**
 * Formato estandar interno de una cuenta/factura.
 * Todos los montos en centavos COP.
 */
export interface StandardBill {
  invoiceId: string;
  invoiceName: string | null;
  tableIdentifier: string;
  items: StandardBillItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  total: number;
  currency: string;
  createdAt: string;
  rawResponse?: unknown;
}

/**
 * Interfaz que todo adaptador de POS debe implementar.
 * Permite intercambiar Siigo por otro POS sin tocar la logica de negocio.
 */
export interface IPosAdapter {
  /**
   * Autentica con el POS y retorna un token.
   * El adaptador maneja el cache del token internamente.
   */
  authenticate(): Promise<string>;

  /**
   * Obtiene la cuenta abierta de una mesa.
   * @param tableIdentifier - ID del centro de costo o identificador de mesa en el POS
   */
  getBill(tableIdentifier: string): Promise<StandardBill | null>;

  /**
   * Cierra una mesa creando un recibo de pago en el POS.
   * @param invoiceId - ID de la factura a cerrar
   * @param amount - Monto total pagado en centavos COP
   */
  closeTable(invoiceId: string, amount: number): Promise<void>;
}

/**
 * Credenciales necesarias para conectar con un POS.
 */
export interface PosCredentials {
  username: string;
  accessKey: string;
}
