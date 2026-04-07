import type {
  IPaymentAdapter,
  WompiWebhookEvent,
  WompiWidgetConfig,
} from "./types";

/**
 * Adaptador demo de pagos para pruebas sin Wompi real.
 * Simula el flujo completo de pago.
 */
export class DemoPaymentAdapter implements IPaymentAdapter {
  async createTransaction(params: {
    amountInCents: number;
    reference: string;
    redirectUrl: string;
    customerEmail?: string;
  }): Promise<WompiWidgetConfig> {
    return {
      publicKey: "pub_test_DEMO",
      currency: "COP",
      amountInCents: params.amountInCents,
      reference: params.reference,
      signatureIntegrity: "demo-signature",
      redirectUrl: params.redirectUrl,
      customerEmail: params.customerEmail,
    };
  }

  verifyWebhookSignature(_event: WompiWebhookEvent): boolean {
    // En demo siempre es valido
    return true;
  }
}
