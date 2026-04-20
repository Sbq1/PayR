import { PaymentError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import {
  generateWompiChecksum,
  generateIntegritySignature,
  safeEqualHex,
} from "@/lib/utils/hmac";

const WOMPI_FETCH_TIMEOUT_MS = 8_000;
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
    let res: Response;
    try {
      res = await fetch(`${getBaseUrl()}/v1/transactions/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${this.credentials.publicKey}`,
        },
        signal: AbortSignal.timeout(WOMPI_FETCH_TIMEOUT_MS),
      });
    } catch (err) {
      // AbortError → timeout. TypeError → network/DNS.
      const isTimeout =
        err instanceof Error &&
        (err.name === "TimeoutError" || err.name === "AbortError");
      const event = isTimeout ? "wompi.timeout" : "wompi.network_error";
      logger.error(event, {
        transactionId,
        timeoutMs: WOMPI_FETCH_TIMEOUT_MS,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new PaymentError(
        isTimeout
          ? `Timeout consultando transacción (${WOMPI_FETCH_TIMEOUT_MS}ms)`
          : `Error de red consultando transacción`,
        isTimeout ? "WOMPI_TIMEOUT" : "WOMPI_NETWORK"
      );
    }

    if (!res.ok) {
      const isTransient = res.status >= 500 || res.status === 429;
      if (isTransient) {
        logger.error("wompi.5xx", {
          status: res.status,
          transactionId,
        });
      }
      throw new PaymentError(
        `Error consultando transacción (${res.status})${isTransient ? " [transient]" : ""}`,
        isTransient ? "WOMPI_5XX" : "WOMPI_ERROR"
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
