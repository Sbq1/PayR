import {
  generateWompiChecksum,
  generateIntegritySignature,
  safeEqualHex,
} from "@/lib/utils/hmac";
import { wompiFetch } from "./wompi-fetch";
import type {
  IPaymentAdapter,
  WompiCredentials,
  WompiWebhookEvent,
  WompiWidgetConfig,
} from "./types";

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
   * Wompi exige privateKey para consultas GET (publicKey solo sirve para crear/firmar).
   */
  async getTransaction(transactionId: string): Promise<{
    id: string;
    status: string;
    reference: string;
    amountInCents: number;
    paymentMethodType: string;
  }> {
    const { data } = await wompiFetch<{ data: {
      id: string;
      status: string;
      reference: string;
      amount_in_cents: number;
      payment_method_type: string;
    } }>(
      `/v1/transactions/${transactionId}`,
      { bearerToken: this.credentials.privateKey },
      { operation: "getTransaction", transactionId }
    );

    return {
      id: data.id,
      status: data.status,
      reference: data.reference,
      amountInCents: data.amount_in_cents,
      paymentMethodType: data.payment_method_type,
    };
  }
}
