import { PosError } from "@/lib/utils/errors";
import type {
  IPosAdapter,
  PosCredentials,
  StandardBill,
  StandardBillItem,
} from "./types";

const SIIGO_BASE_URL = "https://services.siigo.com/alliances/api";
const SIGN_IN_URL = `${SIIGO_BASE_URL}/siigoapi-users/v1/sign-in`;
const INVOICES_URL = `${SIIGO_BASE_URL}/v1/invoices`;
const PAYMENT_RECEIPTS_URL = `${SIIGO_BASE_URL}/v1/payment-receipts`;
const FETCH_TIMEOUT = 15_000;

/**
 * Cache de tokens por restaurante para evitar re-autenticacion en cada request.
 * Key: "username:accessKey" hash, Value: { token, expiresAt }
 */
const tokenCache = new Map<
  string,
  { token: string; expiresAt: number }
>();

function getCacheKey(creds: PosCredentials): string {
  return `${creds.username}:${creds.accessKey}`;
}

// ─── Siigo API Response Types ───────────────────────────────────────

interface SiigoInvoiceItem {
  id?: string;
  code?: string;
  description?: string;
  quantity: number;
  price: number;
  discount?: { percentage?: number; value?: number };
  taxes?: Array<{
    id?: number;
    name?: string;
    percentage?: number;
    value?: number;
  }>;
  total?: number;
}

interface SiigoInvoice {
  id: string;
  name?: string;
  date?: string;
  currency?: { code?: string };
  cost_center?: number;
  items?: SiigoInvoiceItem[];
  global_discount?: { value?: number };
  created_at?: string;
  total?: number;
}

interface SiigoInvoicesResponse {
  results?: SiigoInvoice[];
  pagination?: {
    page: number;
    page_size: number;
    total_results: number;
  };
}

// ─── Adapter Implementation ─────────────────────────────────────────

export class SiigoAdapter implements IPosAdapter {
  constructor(private credentials: PosCredentials) {}

  async authenticate(): Promise<string> {
    const cacheKey = getCacheKey(this.credentials);
    const cached = tokenCache.get(cacheKey);

    // Token valido por 20 min, renovamos a los 15
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    try {
      const res = await fetch(SIGN_IN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: this.credentials.username,
          accessKey: this.credentials.accessKey,
        }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        throw new PosError(
          `Autenticacion fallida (${res.status}): ${errorBody}`,
          "siigo"
        );
      }

      const data = await res.json();
      const token = data.access_token || data.token;

      if (!token) {
        throw new PosError(
          "Siigo no retorno un token de acceso",
          "siigo"
        );
      }

      // Cache por 15 minutos
      tokenCache.set(cacheKey, {
        token,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });

      return token;
    } catch (error) {
      if (error instanceof PosError) throw error;
      throw new PosError(
        `Error conectando con Siigo: ${(error as Error).message}`,
        "siigo"
      );
    }
  }

  async getBill(tableIdentifier: string): Promise<StandardBill | null> {
    const token = await this.authenticate();

    try {
      // Buscamos facturas abiertas. Siigo no filtra por cost_center en query,
      // asi que obtenemos las recientes y filtramos en memoria.
      const params = new URLSearchParams({
        page: "1",
        page_size: "50",
      });

      const res = await fetch(`${INVOICES_URL}?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      });

      if (res.status === 401) {
        // Token expirado, limpiar cache y reintentar una vez
        tokenCache.delete(getCacheKey(this.credentials));
        return this.getBill(tableIdentifier);
      }

      if (!res.ok) {
        throw new PosError(
          `Error obteniendo facturas (${res.status})`,
          "siigo"
        );
      }

      const data: SiigoInvoicesResponse = await res.json();
      const invoices = data.results || [];

      // Filtrar por centro de costo (mesa)
      const tableInvoice = invoices.find(
        (inv) => String(inv.cost_center) === tableIdentifier
      );

      if (!tableInvoice) {
        return null;
      }

      return this.mapToStandardBill(tableInvoice, tableIdentifier);
    } catch (error) {
      if (error instanceof PosError) throw error;
      throw new PosError(
        `Error consultando cuenta: ${(error as Error).message}`,
        "siigo"
      );
    }
  }

  async closeTable(invoiceId: string, amount: number): Promise<void> {
    const token = await this.authenticate();

    try {
      // Crear recibo de pago (cash receipt) para cerrar la factura
      const res = await fetch(PAYMENT_RECEIPTS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document: { id: invoiceId },
          date: new Date().toISOString().split("T")[0],
          type: "DebtPayment",
          items: [
            {
              value: amount / 100, // Siigo usa pesos, no centavos
            },
          ],
          observations: "Pago via Smart Checkout",
        }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        throw new PosError(
          `Error cerrando mesa (${res.status}): ${errorBody}`,
          "siigo"
        );
      }
    } catch (error) {
      if (error instanceof PosError) throw error;
      throw new PosError(
        `Error cerrando mesa en Siigo: ${(error as Error).message}`,
        "siigo"
      );
    }
  }

  // ─── Private helpers ────────────────────────────────────────────

  private mapToStandardBill(
    invoice: SiigoInvoice,
    tableIdentifier: string
  ): StandardBill {
    const items: StandardBillItem[] = (invoice.items || []).map((item) => {
      const unitPrice = Math.round((item.price || 0) * 100);
      const quantity = item.quantity || 1;
      const discountValue = Math.round((item.discount?.value || 0) * 100);
      const taxValue = (item.taxes || []).reduce(
        (sum, t) => sum + Math.round((t.value || 0) * 100),
        0
      );
      const totalPrice = Math.round((item.total || item.price * quantity) * 100);

      return {
        productId: item.id || null,
        code: item.code || null,
        name: item.description || "Producto sin nombre",
        quantity,
        unitPrice,
        discount: discountValue,
        tax: taxValue,
        totalPrice,
      };
    });

    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
    const totalTax = items.reduce((sum, item) => sum + item.tax, 0);
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      invoiceId: invoice.id,
      invoiceName: invoice.name || null,
      tableIdentifier,
      items,
      subtotal,
      totalDiscount,
      totalTax,
      total,
      currency: invoice.currency?.code || "COP",
      createdAt: invoice.created_at || new Date().toISOString(),
      rawResponse: invoice,
    };
  }
}
