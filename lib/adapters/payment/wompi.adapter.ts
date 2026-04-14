import { PaymentError } from "@/lib/utils/errors";
import {
  generateWompiChecksum,
  generateIntegritySignature,
  safeEqualHex,
} from "@/lib/utils/hmac";
import type {
  IPaymentAdapter,
  WompiCredentials,
  WompiWebhookEvent,
  WompiWidgetConfig,
} from "./types";

const WOMPI_SANDBOX = "https://sandbox.wompi.co";
const WOMPI_PRODUCTION = "https://production.wompi.co";

function getBaseUrl(): string {
  return process.env.WOMPI_ENVIRONMENT === "production"
    ? WOMPI_PRODUCTION
    : WOMPI_SANDBOX;
}

export class WompiAdapter implements IPaymentAdapter {
  constructor(private credentials: WompiCredentials) {}

  async createTransaction(params: {
    amountInCents: number;
    reference: string;
    redirectUrl: string;
    customerEmail?: string;
  }): Promise<WompiWidgetConfig> {
    const { amountInCents, reference, redirectUrl, customerEmail } = params;
    const currency = "COP";

    // Generar firma de integridad para el widget
    const signatureIntegrity = generateIntegritySignature(
      reference,
      amountInCents,
      currency,
      this.credentials.integritySecret
    );

    return {
      publicKey: this.credentials.publicKey,
      currency,
      amountInCents,
      reference,
      signatureIntegrity,
      redirectUrl,
      customerEmail,
    };
  }

  verifyWebhookSignature(event: WompiWebhookEvent): boolean {
    try {
      const { properties, checksum } = event.signature;
      const transactionData = event.data
        .transaction as unknown as Record<string, unknown>;

      const calculatedChecksum = generateWompiChecksum(
        properties,
        transactionData,
        event.timestamp,
        this.credentials.eventsSecret
      );

      return safeEqualHex(calculatedChecksum, checksum);
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return false;
    }
  }

  /**
   * Consulta el estado de una transaccion en Wompi.
   */
  async getTransaction(transactionId: string): Promise<{
    id: string;
    status: string;
    reference: string;
    amountInCents: number;
    paymentMethodType: string;
  }> {
    const res = await fetch(
      `${getBaseUrl()}/v1/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${this.credentials.publicKey}`,
        },
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) {
      const isTransient = res.status >= 500 || res.status === 429;
      throw new PaymentError(
        `Error consultando transacción (${res.status})${isTransient ? " [transient]" : ""}`
      );
    }

    const { data } = await res.json();
    return {
      id: data.id,
      status: data.status,
      reference: data.reference,
      amountInCents: data.amount_in_cents,
      paymentMethodType: data.payment_method_type,
    };
  }
}
