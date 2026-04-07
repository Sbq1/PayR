export interface CreatePaymentParams {
  orderId: string;
  customerEmail?: string;
  redirectUrl: string;
}

export interface PaymentResult {
  paymentId: string;
  wompiTransactionId: string;
  reference: string;
  amountInCents: number;
  currency: string;
  status: string;
  checkoutUrl?: string;
  widgetConfig?: WompiWidgetConfig;
}

export interface WompiWidgetConfig {
  publicKey: string;
  currency: string;
  amountInCents: number;
  reference: string;
  signatureIntegrity: string;
  redirectUrl: string;
  customerEmail?: string;
}

export interface WompiWebhookEvent {
  event: string;
  data: {
    transaction: {
      id: string;
      created_at: string;
      amount_in_cents: number;
      reference: string;
      customer_email: string;
      currency: string;
      payment_method_type: string;
      payment_method: Record<string, unknown>;
      status: string;
      status_message: string | null;
    };
  };
  sent_at: string;
  timestamp: number;
  signature: {
    properties: string[];
    checksum: string;
  };
  environment: string;
}

export type WompiPaymentMethod =
  | "CARD"
  | "PSE"
  | "NEQUI"
  | "BANCOLOMBIA_TRANSFER"
  | "BANCOLOMBIA_QR"
  | "DAVIPLATA"
  | "SU_PLUS";
